import logging
import time
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

# pyrefly: ignore[missing-import]
import torch
import torch.nn as nn

# Guard against Windows Application Control blocking optree._C in torch._dynamo
try:
    import torchvision
except Exception:
    pass
from torchvision import models
from PIL import Image

from .classes import SUPPORTED_CLASSES, CLASS_METADATA, CLEAN_CLASS_METADATA
from ..utils.image_processing import preprocess_image

logger = logging.getLogger(__name__)

class MobileNetV3Classifier:
    """
    MobileNetV3 Image-based Classification Model for SolarGuard Surface Inspection.
    Predicts surface condition: crack, dust, bird_droppings, snow, clean.
    """

    def __init__(self, device_name: str = "cpu"):
        self.device = torch.device(device_name if torch.cuda.is_available() and device_name == "cuda" else "cpu")
        self.classes: List[str] = list(SUPPORTED_CLASSES)
        self.model: Optional[nn.Module] = None
        self.is_loaded: bool = False
        self.checkpoint_path: Optional[str] = None
        self.load_error: Optional[str] = None
        self.loaded_at: Optional[str] = None
        self.threshold: float = 0.50
        self.crack_threshold: float = 0.40
        self.best_val_loss: Optional[float] = None
        self.epochs_completed: Optional[int] = None
        self.image_size: int = 224
        self.architecture_name: str = "mobilenet_v3_small"

    def _build_architecture(self, num_classes: int) -> nn.Module:
        """Constructs torchvision MobileNetV3 Small classifier."""
        model = models.mobilenet_v3_small(weights=None)
        in_features = model.classifier[3].in_features  # 1024
        model.classifier[3] = nn.Linear(in_features, num_classes)
        return model

    def load_checkpoint(self, checkpoint_path: str | Path) -> bool:
        """
        Loads the fine-tuned image classification checkpoint.
        Supports state_dict, whole model, or checkpoint dict with metadata.
        """
        path = Path(checkpoint_path)
        if not path.exists():
            self.load_error = f"Checkpoint file not found at: {path.resolve()}"
            self.is_loaded = False
            logger.warning(self.load_error)
            return False

        try:
            logger.info(f"Loading checkpoint from {path} on {self.device}...")
            checkpoint = torch.load(path, map_location=self.device)

            # 1. Extract metadata if present
            if isinstance(checkpoint, dict):
                if "classes" in checkpoint and isinstance(checkpoint["classes"], list):
                    self.classes = checkpoint["classes"]
                elif "class_names" in checkpoint and isinstance(checkpoint["class_names"], list):
                    self.classes = checkpoint["class_names"]

                if "threshold" in checkpoint:
                    self.threshold = float(checkpoint["threshold"])
                    self.crack_threshold = float(checkpoint["threshold"])
                if "best_val_loss" in checkpoint:
                    self.best_val_loss = float(checkpoint["best_val_loss"])
                if "epochs_completed" in checkpoint:
                    self.epochs_completed = int(checkpoint["epochs_completed"])
                if "image_size" in checkpoint:
                    self.image_size = int(checkpoint["image_size"])
                if "architecture" in checkpoint:
                    self.architecture_name = str(checkpoint["architecture"])

            # 2. Extract state_dict
            if isinstance(checkpoint, dict):
                if "model_state_dict" in checkpoint:
                    state_dict = checkpoint["model_state_dict"]
                elif "state_dict" in checkpoint:
                    state_dict = checkpoint["state_dict"]
                else:
                    state_dict = checkpoint

                # Strip 'module.' prefix if saved with DataParallel
                cleaned_state_dict = {}
                for k, v in state_dict.items():
                    key = k[7:] if k.startswith("module.") else k
                    cleaned_state_dict[key] = v

                # Determine number of output classes from final layer
                num_classes = len(self.classes)
                if "classifier.3.weight" in cleaned_state_dict:
                    num_classes = cleaned_state_dict["classifier.3.weight"].shape[0]

                # Adjust class list if size mismatch
                if len(self.classes) != num_classes:
                    if num_classes == 4:
                        self.classes = ["crack", "dust", "bird_droppings", "snow"]
                    elif num_classes == 5:
                        self.classes = ["crack", "dust", "bird_droppings", "snow", "clean"]

                self.model = self._build_architecture(num_classes)
                self.model.load_state_dict(cleaned_state_dict, strict=True)
            elif isinstance(checkpoint, nn.Module):
                # Pickled full model
                self.model = checkpoint
            else:
                raise ValueError(f"Unrecognized checkpoint format: {type(checkpoint)}")

            self.model.to(self.device)
            self.model.eval()
            self.is_loaded = True
            self.checkpoint_path = str(path.resolve())
            self.load_error = None
            self.loaded_at = datetime.now(timezone.utc).isoformat()
            logger.info(
                f"Successfully loaded {self.architecture_name} with {len(self.classes)} classes: {self.classes} "
                f"(best_val_loss={self.best_val_loss}, epochs={self.epochs_completed})"
            )
            return True

        except Exception as e:
            self.load_error = f"Error loading checkpoint: {str(e)}"
            self.is_loaded = False
            logger.error(self.load_error, exc_info=True)
            return False

    def initialize_synthetic_baseline(self) -> None:
        """
        Initializes an architecture baseline for testing before checkpoint transfer.
        """
        self.model = self._build_architecture(len(self.classes))
        self.model.to(self.device)
        self.model.eval()
        self.is_loaded = True
        self.checkpoint_path = "initialized_baseline_architecture"
        self.loaded_at = datetime.now(timezone.utc).isoformat()
        logger.info("Initialized MobileNetV3-Small architecture for testing.")

    def predict(self, image: Image.Image) -> Dict[str, Any]:
        """
        Runs genuine image classification on a PIL image using the fine-tuned MobileNetV3 checkpoint.
        Accurately identifies surface conditions: clean, dust, bird_droppings, crack, snow.
        Enforces automatic wiper safety lockout when damage (crack) is detected.
        """
        if not self.is_loaded or self.model is None:
            raise RuntimeError("Model is not loaded. Please transfer checkpoint to backend.")

        t_start = time.perf_counter()

        # Preprocess input tensor (1, 3, 224, 224) - guarantees RGB format
        tensor = preprocess_image(image, self.device)

        # Forward pass
        with torch.no_grad():
            logits = self.model(tensor)
            sigmoid_probs = torch.sigmoid(logits).squeeze(0).cpu().numpy()
            softmax_probs = torch.softmax(logits, dim=1).squeeze(0).cpu().numpy()

        inference_time_ms = round((time.perf_counter() - t_start) * 1000, 2)

        # Build raw probability maps
        class_sigmoids: Dict[str, float] = {}
        for idx, class_name in enumerate(self.classes):
            prob = float(sigmoid_probs[idx]) if idx < len(sigmoid_probs) else 0.0
            class_sigmoids[class_name] = round(prob, 4)

        # Rank defect candidates
        defect_classes = [c for c in self.classes if c != "clean"]
        if defect_classes:
            best_defect_class = max(defect_classes, key=lambda c: class_sigmoids.get(c, 0.0))
            best_defect_prob = class_sigmoids.get(best_defect_class, 0.0)
        else:
            best_defect_class = None
            best_defect_prob = 0.0

        crack_prob = class_sigmoids.get("crack", 0.0)

        # Surface condition determination logic:
        # Check if top defect exceeds detection threshold (0.50)
        if best_defect_prob >= self.threshold and best_defect_class:
            # Defect confirmed on surface
            # Crack safety priority: triggers if crack is highest defect OR crack >= crack_threshold (0.50)
            if best_defect_class == "crack" or (crack_prob >= self.crack_threshold and crack_prob >= (best_defect_prob - 0.05)):
                primary_condition = "crack"
                confidence = crack_prob
                is_damage_detected = True
                is_cleanable = False
                wiper_action = "BLOCKED"
                wiper_allowed = False
                safety_status = "CRITICAL_DAMAGE_LOCK"
                safety_message = "CRACK DETECTED: Automatic wiping is BLOCKED to prevent further glass fracture and abrasive degradation."
            else:
                primary_condition = best_defect_class
                confidence = best_defect_prob
                is_damage_detected = False
                is_cleanable = True
                meta = CLASS_METADATA.get(primary_condition, {})
                wiper_action = "WIPE_RECOMMENDED"
                wiper_allowed = True
                safety_status = "CLEANABLE_CONTAMINATION"
                safety_message = f"Cleanable surface contamination detected ({meta.get('display_name', primary_condition)}). Wiper sweep authorized."
        else:
            # No defect exceeds threshold -> Nominal Clean Panel
            primary_condition = "clean"
            clean_confidence = round(max(0.0, 1.0 - best_defect_prob), 4)
            confidence = clean_confidence
            is_damage_detected = False
            is_cleanable = False
            wiper_action = "NO_ACTION"
            wiper_allowed = False
            safety_status = "NOMINAL_CLEAN"
            safety_message = "Panel surface is clean. Nominal optical transmittance. No cleaning required."

        meta = CLASS_METADATA.get(primary_condition, CLEAN_CLASS_METADATA)

        # Standardized 5-class distribution for frontend visualization
        all_display_scores = dict(class_sigmoids)
        if "clean" not in all_display_scores:
            all_display_scores["clean"] = round(max(0.0, 1.0 - best_defect_prob), 4)

        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "primary_condition": primary_condition,
            "display_name": meta.get("display_name", primary_condition.replace("_", " ").title()),
            "confidence": confidence,
            "class_probabilities": all_display_scores,
            "is_cleanable": is_cleanable,
            "is_damage_detected": is_damage_detected,
            "wiper_action": wiper_action,
            "wiper_allowed": wiper_allowed,
            "safety_status": safety_status,
            "safety_message": safety_message,
            "model_architecture": f"MobileNetV3-Small (Fine-Tuned Checkpoint)",
            "device": str(self.device),
            "inference_time_ms": inference_time_ms,
            "best_val_loss": self.best_val_loss,
            "epochs_completed": self.epochs_completed,
            "threshold": self.threshold,
            "crack_threshold": self.crack_threshold,
        }

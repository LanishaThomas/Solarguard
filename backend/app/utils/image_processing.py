import io
from PIL import Image, ImageOps
import torch
try:
    import torchvision
except Exception:
    pass
from torchvision import transforms


# Preprocessing transforms matching torchvision MobileNetV3-Small input specification
# Direct 224x224 resize preserves the entire solar panel surface without cropping out defects
PREPROCESS_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224), interpolation=transforms.InterpolationMode.BILINEAR),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])

def load_image_from_bytes(image_bytes: bytes) -> Image.Image:
    """Loads and standardizes an image from raw bytes."""
    image = Image.open(io.BytesIO(image_bytes))
    image = ImageOps.exif_transpose(image)
    if image.mode != "RGB":
        image = image.convert("RGB")
    return image

def preprocess_image(image: Image.Image, device: torch.device) -> torch.Tensor:
    """Preprocesses a PIL Image into a PyTorch tensor (1, 3, 224, 224)."""
    if image.mode != "RGB":
        image = image.convert("RGB")
    tensor = PREPROCESS_TRANSFORM(image)
    tensor = tensor.unsqueeze(0).to(device)
    return tensor

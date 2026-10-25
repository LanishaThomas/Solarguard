"""
SolarGuard Model Classes & Safety Policy
Matches fine-tuned MobileNetV3 image classification output heads.
"""

from typing import Dict, Any

# Canonical class list
SUPPORTED_CLASSES = [
    "crack",
    "dust",
    "bird_droppings",
    "snow",
    "clean"
]

# Metadata for each class
CLASS_METADATA: Dict[str, Dict[str, Any]] = {
    "crack": {
        "display_name": "Crack / Structural Damage",
        "is_damage": True,
        "is_cleanable": False,
        "severity": "critical",
        "description": "Surface silicon or glass fracture detected. DO NOT WIPE.",
        "wiper_action": "BLOCKED",
    },
    "dust": {
        "display_name": "Dust Accumulation",
        "is_damage": False,
        "is_cleanable": True,
        "severity": "warning",
        "description": "Particulate film causing optical attenuation.",
        "wiper_action": "WIPE_RECOMMENDED",
    },
    "bird_droppings": {
        "display_name": "Bird Droppings",
        "is_damage": False,
        "is_cleanable": True,
        "severity": "warning",
        "description": "Opaque localized contamination causing hot-spot risk.",
        "wiper_action": "WIPE_RECOMMENDED",
    },
    "snow": {
        "display_name": "Snow Accumulation",
        "is_damage": False,
        "is_cleanable": True,
        "severity": "warning",
        "description": "Snow layer blocking solar irradiance across cell quadrants.",
        "wiper_action": "WIPE_RECOMMENDED",
    },
    "clean": {
        "display_name": "Clean Surface",
        "is_damage": False,
        "is_cleanable": False,
        "severity": "optimal",
        "description": "Surface is clear with nominal optical transmittance.",
        "wiper_action": "NO_ACTION",
    }
}

CLEAN_CLASS_METADATA = CLASS_METADATA["clean"]

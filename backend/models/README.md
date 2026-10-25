# SolarGuard MobileNetV3 Checkpoint Storage

Place your fine-tuned PyTorch model checkpoint in this folder:

```text
backend/models/solarguard_mobilenetv3_50epoch_finetuned.pt
```

## Model Architecture Specifications
- **Base Architecture**: `torchvision.models.mobilenet_v3_small`
- **Pretrained Base**: ImageNet-1K (`MobileNet_V3_Small_Weights.DEFAULT`)
- **Training Epochs**: 50 epochs fine-tuned on solar panel defect images
- **Classification Paradigm**: **Multi-Label Classification** (Sigmoid activation per output logit)
- **Supported Defect Classes**:
  1. `crack` (Structural / silicon fracture — **Wiping strictly blocked**)
  2. `dust` (Surface particulate soiling — Cleanable)
  3. `bird_droppings` (Localized spot contamination — Cleanable)
  4. `snow` (Cold-climate snow accumulation — Cleanable)
- **Input Resolution**: $3 \times 224 \times 224$ (RGB)
- **Normalization**: ImageNet Mean `[0.485, 0.456, 0.406]`, Std `[0.229, 0.224, 0.225]`

## Secure Google Drive Transfer
The original checkpoint is located in Google Drive:
`/content/drive/MyDrive/SolarGuard/models/solarguard_mobilenetv3_50epoch_finetuned.pt`

To transfer it securely:
```bash
# View instructions
python backend/scripts/download_checkpoint.py --info

# Copy from your local Downloads folder
python backend/scripts/download_checkpoint.py --source "C:/Users/Lanisha/Downloads/solarguard_mobilenetv3_50epoch_finetuned.pt"
```

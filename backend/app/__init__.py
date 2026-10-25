# SolarGuard Backend App
# Guard against Windows Application Control blocking optree._C in torch._dynamo
try:
    import torchvision
except Exception:
    pass


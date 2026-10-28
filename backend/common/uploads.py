import uuid


def evidence_path(instance, filename):
    """Use generated names so resident-provided paths never reach storage."""
    extension = ".png" if filename.lower().endswith(".png") else ".jpg"
    return f"evidence/{uuid.uuid4().hex}{extension}"

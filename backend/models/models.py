"""Django model discovery; domain definitions live in focused modules."""

from .complaint import Complaint, ComplaintStatusChange

__all__ = ["Complaint", "ComplaintStatusChange"]

from pydantic import BaseModel, Field
from typing import Optional

class Plot(BaseModel):
    """
    Represents the physical boundaries of the construction site.
    """
    length: float = Field(..., gt=0, description="The length of the plot in feet.")
    width: float = Field(..., gt=0, description="The width of the plot in feet.")
    construction_percentage: Optional[float] = Field(100.0, ge=0, le=100, description="The percentage of the plot area to be constructed.")

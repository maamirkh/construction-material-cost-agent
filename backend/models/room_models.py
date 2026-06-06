from pydantic import BaseModel, Field

class Room(BaseModel):
    """
    Represents an individual room or functional space within the construction plan.
    """
    room_type: str = Field(..., description="The category of room (e.g., bedroom, kitchen, washroom).")
    length: float = Field(..., gt=0, description="The length of the room in feet.")
    width: float = Field(..., gt=0, description="The width of the room in feet.")
    quantity: int = Field(default=1, ge=1, description="The number of rooms of this specific type and dimension.")

from fastapi import APIRouter, Response, Query
from pydantic import BaseModel
from typing import Optional
from backend.app.services.image_service import generate_practical_image_url, generate_svg_visual

router = APIRouter(prefix="/api/images", tags=["images"])

class ImageGenerateRequest(BaseModel):
    prompt: str
    style: Optional[str] = "Isometric 3D Architecture Blueprint"
    topic: Optional[str] = "Engineering"

class ImageGenerateResponse(BaseModel):
    image_url: str
    prompt: str
    style: str

@router.get("/render")
async def render_svg_visual(
    topic: str = Query("CreatorOS", description="Topic tag"),
    style: str = Query("Glassmorphic Data Flow", description="Visual style"),
    title: str = Query("", description="Title text to display")
):
    """
    Renders a dynamic, zero-latency vector graphic asset in dark glassmorphism.
    Useful as an instant preview, reliable fallback, and offline visual generator.
    """
    svg_content = generate_svg_visual(topic=topic, style=style, title=title)
    return Response(content=svg_content, media_type="image/svg+xml")

@router.post("/generate", response_model=ImageGenerateResponse)
async def generate_image(req: ImageGenerateRequest):
    """
    Practically generates a production-ready AI image URL using the prompt.
    """
    url = generate_practical_image_url(
        prompt=req.prompt,
        style=req.style or "Isometric 3D Architecture Blueprint",
        topic=req.topic or "Engineering"
    )
    return ImageGenerateResponse(
        image_url=url,
        prompt=req.prompt,
        style=req.style or "Isometric 3D Architecture Blueprint"
    )

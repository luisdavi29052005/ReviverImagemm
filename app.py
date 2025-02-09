from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from supabase import create_client, Client
import os
import cv2
import numpy as np
import torch
import uuid
import logging
from pathlib import Path
import firebase_admin
from firebase_admin import credentials, firestore
from gfpgan import GFPGANer
from realesrgan import RealESRGANer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Supabase client
supabase_url = os.getenv("VITE_SUPABASE_URL")
supabase_key = os.getenv("VITE_SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    cred = credentials.Certificate("firebase-credentials.json")
    firebase_admin.initialize_app(cred)
else:
    logger.info("Firebase already initialized.")

db = firestore.client()
logger.info("Firebase initialized successfully")

# Clear CUDA cache
if torch.cuda.is_available():
    torch.cuda.empty_cache()

# Create absolute paths
BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / 'output_images'
MODELS_DIR = BASE_DIR / 'models'
GFPGAN_DIR = MODELS_DIR / 'GFPGAN'
REALESRGAN_DIR = MODELS_DIR / 'RealESRGAN'

# Create directories
for directory in [OUTPUT_DIR, GFPGAN_DIR, REALESRGAN_DIR]:
    directory.mkdir(parents=True, exist_ok=True)
    os.chmod(directory, 0o755)

def format_firebase_uid(uid: str) -> str:
    """Convert Firebase UID to UUID format for Supabase"""
    if '-' in uid:  # Already in UUID format
        return uid
    # Generate a deterministic UUID v5 using Firebase UID as namespace
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"firebase:{uid}"))

def initialize_gfpgan(version, upscale, bg_upsampler, real_esrgan):
    """Initialize GFPGAN with specified settings"""
    try:
        logger.info(f"Initializing GFPGAN with version={version}, upscale={upscale}, bg_upsampler={bg_upsampler}")
        
        bg_upsampler_instance = None
        
        if bg_upsampler == 'realesrgan':
            scale = 2 if real_esrgan == 'x2' else 4
            model = RealESRGANer(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=scale)
            model_path = REALESRGAN_DIR / f'RealESRGAN_x{scale}plus.pth'
            
            bg_upsampler_instance = RealESRGANer(
                scale=scale,
                model_path=str(model_path),
                model=model,
                tile=400,
                tile_pad=10,
                pre_pad=0,
                half=torch.cuda.is_available()
            )
            logger.info("Background upsampler initialized successfully")

        version_map = {
            '1.2': ('clean', 2, 'GFPGANCleanv1-NoCE-C2', 'https://github.com/TencentARC/GFPGAN/releases/download/v0.2.0/GFPGANCleanv1-NoCE-C2.pth'),
            '1.3': ('clean', 2, 'GFPGANv1.3', 'https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.3.pth'),
            '1.4': ('clean', 2, 'GFPGANv1.4', 'https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.4.pth'),
            'RestoreFormer': ('RestoreFormer', 2, 'RestoreFormer', 'https://github.com/TencentARC/GFPGAN/releases/download/v1.3.4/RestoreFormer.pth')
        }

        if version not in version_map:
            raise ValueError(f"Invalid model version: {version}")

        arch, channel_multiplier, model_name, url = version_map[version]
        model_path = GFPGAN_DIR / f'{model_name}.pth'
        
        if not model_path.exists():
            model_path = url
            logger.info(f"Using remote model: {url}")
        else:
            logger.info(f"Using local model: {model_path}")

        restorer = GFPGANer(
            model_path=str(model_path) if isinstance(model_path, Path) else model_path,
            upscale=int(upscale),
            arch=arch,
            channel_multiplier=channel_multiplier,
            bg_upsampler=bg_upsampler_instance
        )
        logger.info("GFPGAN initialized successfully")
        
        return restorer
    except Exception as e:
        logger.error(f"Error initializing GFPGAN: {str(e)}")
        raise

@app.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    version: str = Form('1.4'),
    bg_upsampler: str = Form('none'),
    real_esrgan: str = Form('x4'),
    upscale: str = Form('4')
):
    """Process and enhance uploaded image"""
    try:
        logger.info(f"Received image upload request: {file.filename} for user: {user_id}")
        
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image
        img_bytes = await file.read()
        input_img = cv2.imdecode(np.frombuffer(img_bytes, np.uint8), cv2.IMREAD_COLOR)
        
        if input_img is None:
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        # Initialize GFPGAN
        restorer = initialize_gfpgan(version, upscale, bg_upsampler, real_esrgan)
        
        # Process image
        _, _, restored_img = restorer.enhance(input_img, paste_back=True)
        
        # Convert processed image to bytes
        _, buffer = cv2.imencode('.jpg', restored_img)
        processed_bytes = buffer.tobytes()
        
        # Format user_id as UUID for Supabase
        formatted_user_id = format_firebase_uid(user_id)
        
        # Upload to Supabase Storage
        file_path = f"{formatted_user_id}/{uuid.uuid4().hex}.jpg"
        
        try:
            # Upload to Supabase storage
            result = supabase.storage.from_("processed-images").upload(
                file_path,
                processed_bytes,
                file_options={"content-type": "image/jpeg"}
            )
            
            # Get public URL
            public_url = supabase.storage.from_("processed-images").get_public_url(file_path)
            logger.info(f"Upload complete. Image URL: {public_url}")
            
            return JSONResponse(
                content={
                    "processedImage": public_url,
                    "status": "success"
                }
            )
        except Exception as e:
            logger.error(f"Supabase upload error: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to upload processed image")

    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "cuda_available": torch.cuda.is_available(),
        "firebase_initialized": len(firebase_admin._apps) > 0,
        "base_dir": str(BASE_DIR),
        "output_dir": str(OUTPUT_DIR),
        "output_dir_exists": OUTPUT_DIR.exists(),
        "output_dir_writable": os.access(OUTPUT_DIR, os.W_OK)
    }

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting FastAPI server...")
    uvicorn.run("app:app", host="localhost", port=5000, reload=True)
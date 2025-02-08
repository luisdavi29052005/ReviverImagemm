from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os
import cv2
import numpy as np
import torch
import uuid
import logging
from pathlib import Path
import firebase_admin
from firebase_admin import credentials, firestore

# Configuração do logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configuração do CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializa o Firebase
if not firebase_admin._apps:
    cred = credentials.Certificate("C:\\Users\\Davi Ferrer\\Downloads\\project-bolt-sb1-ej5svars (9)\\project\\firebase-credentials.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()
logger.info("Firebase initialized successfully")

# Limpa a cache do CUDA, se disponível
if torch.cuda.is_available():
    torch.cuda.empty_cache()

# Define os diretórios base
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR = STATIC_DIR / "output_images"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

logger.info(f"Base directory: {BASE_DIR}")
logger.info(f"Static directory: {STATIC_DIR}")
logger.info(f"Output directory: {OUTPUT_DIR}")

# Monta a pasta estática para servir os arquivos
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

def get_local_file_url(file_path: Path) -> str:
    return f"file:///{file_path.as_posix()}"

async def upload_to_firestore(image_path: Path, user_id: str):
    try:
        local_image_url = get_local_file_url(image_path)
        doc_ref = db.collection('processedImages').document()
        doc_ref.set({
            'id': doc_ref.id,
            'userId': user_id,
            'processedImage': local_image_url,
            'createdAt': firestore.SERVER_TIMESTAMP
        })
        return {'id': doc_ref.id, 'processedImage': local_image_url}
    except Exception as e:
        logger.error(f"Error saving metadata to Firestore: {str(e)}")
        raise

@app.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    user_id: str = Form(...)
):
    try:
        logger.info(f"Received image upload request: {file.filename} for user: {user_id}")

        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")

        img_bytes = await file.read()
        input_img = cv2.imdecode(np.frombuffer(img_bytes, np.uint8), cv2.IMREAD_COLOR)
        if input_img is None:
            raise HTTPException(status_code=400, detail="Invalid image file")

        output_image_path = OUTPUT_DIR / f'restored_{uuid.uuid4().hex}.jpg'
        success = cv2.imwrite(str(output_image_path), input_img)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save the processed image.")

        firestore_result = await upload_to_firestore(output_image_path, user_id)
        return JSONResponse(content={'id': firestore_result['id'], 'processedImage': firestore_result['processedImage'], 'status': 'success'})
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "cuda_available": torch.cuda.is_available(),
        "firebase_initialized": len(firebase_admin._apps) > 0,
        "output_dir_exists": OUTPUT_DIR.exists(),
        "output_dir_writable": os.access(OUTPUT_DIR, os.W_OK)
    }

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting FastAPI server...")
    uvicorn.run(app, host="0.0.0.0", port=5000)

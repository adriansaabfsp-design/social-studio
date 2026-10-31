import json, os, sys
os.environ['HF_HUB_OFFLINE']='1'
import mlx_whisper
result=mlx_whisper.transcribe(sys.argv[1], path_or_hf_repo='mlx-community/whisper-large-v3-turbo', verbose=False)
print(json.dumps({'text':result.get('text','').strip(),'language':result.get('language','unknown'),'model':'whisper-large-v3-turbo (local MLX)'},ensure_ascii=False))

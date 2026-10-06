window.COMPARISON_DATA = {
  "width": 1536,
  "height": 1152,
  "input": "./assets/comparison/input.png",
  "models": [
    {
      "id": "marina",
      "name": "Marina",
      "src": "./assets/comparison/marina.png",
      "parameters": 988,
      "method": "Native 2× · PyTorch FP32 reference"
    },
    {
      "id": "Restore_CNN_L",
      "name": "Restore_CNN_L",
      "src": "./assets/comparison/Restore_CNN_L.png",
      "parameters": 4139,
      "method": "Restoration + mpv default 2× scaling"
    },
    {
      "id": "Restore_CNN_M",
      "name": "Restore_CNN_M",
      "src": "./assets/comparison/Restore_CNN_M.png",
      "parameters": 2035,
      "method": "Restoration + mpv default 2× scaling"
    },
    {
      "id": "Restore_CNN_S",
      "name": "Restore_CNN_S",
      "src": "./assets/comparison/Restore_CNN_S.png",
      "parameters": 915,
      "method": "Restoration + mpv default 2× scaling"
    },
    {
      "id": "Restore_CNN_Soft_L",
      "name": "Restore_CNN_Soft_L",
      "src": "./assets/comparison/Restore_CNN_Soft_L.png",
      "parameters": 4139,
      "method": "Restoration + mpv default 2× scaling"
    },
    {
      "id": "Restore_CNN_Soft_M",
      "name": "Restore_CNN_Soft_M",
      "src": "./assets/comparison/Restore_CNN_Soft_M.png",
      "parameters": 2035,
      "method": "Restoration + mpv default 2× scaling"
    },
    {
      "id": "Restore_CNN_Soft_S",
      "name": "Restore_CNN_Soft_S",
      "src": "./assets/comparison/Restore_CNN_Soft_S.png",
      "parameters": 915,
      "method": "Restoration + mpv default 2× scaling"
    },
    {
      "id": "Restore_CNN_Soft_UL",
      "name": "Restore_CNN_Soft_UL",
      "src": "./assets/comparison/Restore_CNN_Soft_UL.png",
      "parameters": 18927,
      "method": "Restoration + mpv default 2× scaling"
    },
    {
      "id": "Restore_CNN_Soft_VL",
      "name": "Restore_CNN_Soft_VL",
      "src": "./assets/comparison/Restore_CNN_Soft_VL.png",
      "parameters": 8683,
      "method": "Restoration + mpv default 2× scaling"
    },
    {
      "id": "Restore_CNN_UL",
      "name": "Restore_CNN_UL",
      "src": "./assets/comparison/Restore_CNN_UL.png",
      "parameters": 18927,
      "method": "Restoration + mpv default 2× scaling"
    },
    {
      "id": "Restore_CNN_VL",
      "name": "Restore_CNN_VL",
      "src": "./assets/comparison/Restore_CNN_VL.png",
      "parameters": 8683,
      "method": "Restoration + mpv default 2× scaling"
    },
    {
      "id": "Restore_GAN_UL",
      "name": "Restore_GAN_UL",
      "src": "./assets/comparison/Restore_GAN_UL.png",
      "parameters": 14975,
      "method": "Restoration + mpv default 2× scaling"
    },
    {
      "id": "Restore_GAN_UUL",
      "name": "Restore_GAN_UUL",
      "src": "./assets/comparison/Restore_GAN_UUL.png",
      "parameters": 14975,
      "method": "Restoration + mpv default 2× scaling"
    },
    {
      "id": "3DGraphics_AA_Upscale_x2_US",
      "name": "3DGraphics_AA_Upscale_x2_US",
      "src": "./assets/comparison/3DGraphics_AA_Upscale_x2_US.png",
      "parameters": 552,
      "method": "Native 2× · mpv gpu-next / Vulkan"
    },
    {
      "id": "3DGraphics_Upscale_x2_US",
      "name": "3DGraphics_Upscale_x2_US",
      "src": "./assets/comparison/3DGraphics_Upscale_x2_US.png",
      "parameters": 552,
      "method": "Native 2× · mpv gpu-next / Vulkan"
    },
    {
      "id": "Upscale_CNN_x2_L",
      "name": "Upscale_CNN_x2_L",
      "src": "./assets/comparison/Upscale_CNN_x2_L.png",
      "parameters": 4284,
      "method": "Native 2× · mpv gpu-next / Vulkan"
    },
    {
      "id": "Upscale_CNN_x2_M",
      "name": "Upscale_CNN_x2_M",
      "src": "./assets/comparison/Upscale_CNN_x2_M.png",
      "parameters": 2092,
      "method": "Native 2× · mpv gpu-next / Vulkan"
    },
    {
      "id": "Upscale_CNN_x2_S",
      "name": "Upscale_CNN_x2_S",
      "src": "./assets/comparison/Upscale_CNN_x2_S.png",
      "parameters": 988,
      "method": "Native 2× · mpv gpu-next / Vulkan"
    },
    {
      "id": "Upscale_CNN_x2_UL",
      "name": "Upscale_CNN_x2_UL",
      "src": "./assets/comparison/Upscale_CNN_x2_UL.png",
      "parameters": 17412,
      "method": "Native 2× · mpv gpu-next / Vulkan"
    },
    {
      "id": "Upscale_CNN_x2_VL",
      "name": "Upscale_CNN_x2_VL",
      "src": "./assets/comparison/Upscale_CNN_x2_VL.png",
      "parameters": 8540,
      "method": "Native 2× · mpv gpu-next / Vulkan"
    },
    {
      "id": "Upscale_GAN_x2_M",
      "name": "Upscale_GAN_x2_M",
      "src": "./assets/comparison/Upscale_GAN_x2_M.png",
      "parameters": 8315,
      "method": "Native 2× · mpv gpu-next / Vulkan"
    },
    {
      "id": "Upscale_GAN_x2_S",
      "name": "Upscale_GAN_x2_S",
      "src": "./assets/comparison/Upscale_GAN_x2_S.png",
      "parameters": 4223,
      "method": "Native 2× · mpv gpu-next / Vulkan"
    },
    {
      "id": "Upscale_Denoise_CNN_x2_L",
      "name": "Upscale_Denoise_CNN_x2_L",
      "src": "./assets/comparison/Upscale_Denoise_CNN_x2_L.png",
      "parameters": 4284,
      "method": "Native 2× · mpv gpu-next / Vulkan"
    },
    {
      "id": "Upscale_Denoise_CNN_x2_M",
      "name": "Upscale_Denoise_CNN_x2_M",
      "src": "./assets/comparison/Upscale_Denoise_CNN_x2_M.png",
      "parameters": 2092,
      "method": "Native 2× · mpv gpu-next / Vulkan"
    },
    {
      "id": "Upscale_Denoise_CNN_x2_S",
      "name": "Upscale_Denoise_CNN_x2_S",
      "src": "./assets/comparison/Upscale_Denoise_CNN_x2_S.png",
      "parameters": 988,
      "method": "Native 2× · mpv gpu-next / Vulkan"
    },
    {
      "id": "Upscale_Denoise_CNN_x2_UL",
      "name": "Upscale_Denoise_CNN_x2_UL",
      "src": "./assets/comparison/Upscale_Denoise_CNN_x2_UL.png",
      "parameters": 17412,
      "method": "Native 2× · mpv gpu-next / Vulkan"
    },
    {
      "id": "Upscale_Denoise_CNN_x2_VL",
      "name": "Upscale_Denoise_CNN_x2_VL",
      "src": "./assets/comparison/Upscale_Denoise_CNN_x2_VL.png",
      "parameters": 8540,
      "method": "Native 2× · mpv gpu-next / Vulkan"
    }
  ],
  "provenance": {
    "input_sha256": "d056d77fe4fad99a1ed8be7b76c203d92cffcb485b146cd3d805d2dfbe79f7f4",
    "checkpoint_sha256": "bf4b380fa1bb3b94799f5e2806110a3643a658e2f56ade1ae684e4eef9a42928",
    "notes": "Original JPEG decoded to RGB PNG without added degradation or resizing. All results are lossless RGB PNG. No HR ground truth. Restore shaders use mpv default scaling after restoration. GPU shader arithmetic is not claimed to be native FP16."
  }
};

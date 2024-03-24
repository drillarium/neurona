1. Render graphics, Vumeters, Metadata information... Componse all the extra information

{
  "window_layout": {
    "width": 1920,
    "height": 1080,
	"frame_rate": "25/1",
	"format": "RGB"
    "components": [
      {
		"name": "Component",
        "type": "video",
        "position": { "x": 0, "y": 0 },
        "size": { "width": 960, "height": 540 },
        "source": "video_source_1.mp4"
      },
      {
		"name": "Component",
        "type": "graphic",
        "position": { "x": 960, "y": 0 },
        "size": { "width": 960, "height": 540 },
        "source": "graphic_image.png"
      },
      {
		"name": "Component",
        "type": "metadata",
        "position": { "x": 0, "y": 540 },
        "size": { "width": 1920, "height": 540 },
        "source": "metadata_source.json"
      },
      {
		"name": "Component",
        "type": "video",
        "position": { "x": 0, "y": 540 },
        "size": { "width": 960, "height": 540 },
        "source": "video_source_2.mp4"
      },
      {
		"name": "Component",
        "type": "graphic",
        "position": { "x": 960, "y": 540 },
        "size": { "width": 960, "height": 540 },
        "source": "graphic_image_2.png"
      }
    ]
  }
}
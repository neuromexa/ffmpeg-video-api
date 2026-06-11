const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.raw({ type: '*/*', limit: '50mb' }));

app.post('/create-video', (req, res) => {
  const matchLabel = (req.headers['x-match-label'] || 'Match').replace(/'/g, '').replace(/:/g, '');
  const predictedScore = (req.headers['x-predicted-score'] || '2-1').replace(/'/g, '');
  const group = (req.headers['x-group'] || 'GROUP A').replace(/'/g, '');

  const audioPath = '/tmp/audio.mp3';
  const outputPath = '/tmp/output.mp4';

  try {
    fs.writeFileSync(audioPath, req.body);

    execSync(`ffmpeg -y \
      -f lavfi -i color=c=0x0a0a2e:size=1080x1920:rate=30 \
      -i ${audioPath} \
      -vf "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='WORLD CUP 2026':fontcolor=gold:fontsize=70:x=(w-text_w)/2:y=300, \
      drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${matchLabel}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=500, \
      drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${group}':fontcolor=cyan:fontsize=40:x=(w-text_w)/2:y=620, \
      drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='Predicted Score':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=800, \
      drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${predictedScore}':fontcolor=yellow:fontsize=100:x=(w-text_w)/2:y=880" \
      -c:v libx264 -c:a aac -shortest ${outputPath}`, { timeout: 120000 });

    const videoData = fs.readFileSync(outputPath);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', videoData.length);
    res.end(videoData);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

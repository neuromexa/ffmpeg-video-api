const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.raw({ type: '*/*', limit: '50mb' }));

app.post('/create-video', async (req, res) => {
  const matchLabel = req.headers['x-match-label'] || 'Match';
  const predictedScore = req.headers['x-predicted-score'] || '2-1';
  const group = req.headers['x-group'] || 'GROUP_A';

  const tmpDir = '/tmp';
  const audioPath = path.join(tmpDir, 'audio.mp3');
  const outputPath = path.join(tmpDir, 'output.mp4');

  try {
    fs.writeFileSync(audioPath, req.body);

    const safeMatch = matchLabel.replace(/'/g, '').replace(/:/g, '');
    const safeScore = predictedScore.replace(/'/g, '');
    const safeGroup = group.replace(/'/g, '');

    execSync(`ffmpeg -y \
      -f lavfi -i color=c=0x0a0a2e:size=1080x1920:rate=30 \
      -i ${audioPath} \
      -vf "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='WORLD CUP 2026':fontcolor=gold:fontsize=70:x=(w-text_w)/2:y=300, \
      drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${safeMatch}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=500, \
      drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${safeGroup}':fontcolor=cyan:fontsize=40:x=(w-text_w)/2:y=620, \
      drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='Predicted Score':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=800, \
      drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${safeScore}':fontcolor=yellow:fontsize=100:x=(w-text_w)/2:y=880" \
      -c:v libx264 -c:a aac -shortest ${outputPath}`);

    const videoData = fs.readFileSync(outputPath);
    res.set('Content-Type', 'video/mp4');
    res.send(videoData);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

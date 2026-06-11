const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

const app = express();
const FFMPEG = ffmpegInstaller.path;

app.use(express.json({ limit: '50mb' }));

app.post('/create-video', async (req, res) => {
  const { videoUrls, audioBase64 } = req.body;

  const tmpDir = '/tmp';
  const audioPath = path.join(tmpDir, 'audio.mp3');
  const outputPath = path.join(tmpDir, 'output.mp4');
  const listPath = path.join(tmpDir, 'list.txt');

  try {
    // Sesi base64'ten kaydet
    fs.writeFileSync(audioPath, Buffer.from(audioBase64, 'base64'));

    // Videoları indir
    const videoPaths = [];
    for (let i = 0; i < videoUrls.length; i++) {
      const vPath = path.join(tmpDir, `video${i}.mp4`);
      const vRes = await axios.get(videoUrls[i], { responseType: 'arraybuffer' });
      fs.writeFileSync(vPath, vRes.data);
      videoPaths.push(vPath);
    }

    // FFmpeg concat listesi
    const listContent = videoPaths.map(p => `file '${p}'`).join('\n');
    fs.writeFileSync(listPath, listContent);

    // Videoları birleştir + ses ekle
    execSync(`${FFMPEG} -y \
      -f concat -safe 0 -i ${listPath} \
      -i ${audioPath} \
      -c:v libx264 -c:a aac -shortest ${outputPath}`, { timeout: 180000 });

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

const downloadUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2M5MzVmYjNlYzY3YzQ5MTBhNWE2NWZiY2YzYmY0MzAwEgsSBxCsmIXziQcYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDkyMDg0NDE5NTgwMzQwNzE2NA&filename=&opi=96797242";

import fs from 'fs';

async function downloadHtml() {
  console.log('Downloading generated Stitch HTML...');
  const res = await fetch(downloadUrl);
  if (!res.ok) {
    console.error('Failed to download HTML:', res.status);
    return;
  }
  const text = await res.text();
  console.log('Downloaded HTML size:', text.length, 'bytes');
  fs.writeFileSync('C:/Users/DELL/Desktop/Vi/docs/stitch-studio-design.html', text, 'utf8');
  console.log('Saved to docs/stitch-studio-design.html');
}

downloadHtml();

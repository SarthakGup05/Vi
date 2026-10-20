async function testApi() {
  console.log('Testing live http://localhost:3000/api/upload-url...');
  try {
    const res = await fetch('http://localhost:3000/api/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'test-reel.mp4',
        contentType: 'video/mp4'
      })
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Response:', data);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

testApi();

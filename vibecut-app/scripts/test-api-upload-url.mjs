import { getPresignedUploadUrl, isAwsConfigured } from '../src/lib/aws.ts';

// Test that aws helper can generate presigned URL cleanly
console.log('Is AWS Configured?', isAwsConfigured());
getPresignedUploadUrl('sample-creator-reel.mp4', 'video/mp4')
  .then(res => {
    console.log('✅ getPresignedUploadUrl succeeded!');
    console.log('Bucket:', res.bucket);
    console.log('FileKey:', res.fileKey);
    console.log('UploadUrl starts with:', res.uploadUrl.slice(0, 60) + '...');
  })
  .catch(err => {
    console.error('Error:', err);
  });

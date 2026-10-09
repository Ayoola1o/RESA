import fs from 'fs';
import path from 'path';
import { mediaService } from '../src/server/services/media-service';
import { userRepository } from '../src/server/repositories/user-repository';
import { propertyRepository } from '../src/server/repositories/property-repository';

async function runSection7MediaTests() {
  console.log('====================================================');
  console.log('🧪 TESTING SECTION 7: PROPERTY MEDIA & SECURE STORAGE');
  console.log('====================================================\n');

  const allProps = await propertyRepository.listAll();
  const testProp = allProps[0];
  if (!testProp) throw new Error('No test property found');

  const owner = (await userRepository.findById(testProp.ownerId)) || (await userRepository.findByEmail('owner@prophunta.ai'));
  const seeker = await userRepository.findByEmail('seeker@prophunta.ai');
  if (!owner) throw new Error('Owner user not found');

  console.log(`Testing Media for Property: "${testProp.title}" (ID: ${testProp.id}, Owner: ${owner.email})`);

  // Test unauthorized rejection
  if (seeker) {
    try {
      await mediaService.uploadMedia(seeker, testProp.id, Buffer.from('test'), 'test.png', 'image/png');
      throw new Error('Expected seeker upload to fail');
    } catch (e: any) {
      if (e.message.includes('Unauthorized')) {
        console.log('  ✓ Security check passed: Unauthorized user correctly rejected');
      } else {
        throw e;
      }
    }
  }

  // 2. Upload an Image Buffer to secure storage
  console.log('\n1. Testing Image Upload to Secure Storage (.data/uploads/media/)...');
  // 1x1 transparent PNG buffer
  const imageBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  const uploadedImage = await mediaService.uploadMedia(
    owner,
    testProp.id,
    imageBuffer,
    'living_room_aerial_view.png',
    'image/png',
    'High-Ceiling Living Room with Italian Chandeliers',
    true // isPrimary
  );

  console.log(`  ✓ Image stored persistently:`);
  console.log(`    - Media ID: ${uploadedImage.id}`);
  console.log(`    - URL: ${uploadedImage.url}`);
  console.log(`    - Type: ${uploadedImage.type}`);
  console.log(`    - Caption: "${uploadedImage.caption}"`);
  console.log(`    - Is Primary: ${uploadedImage.isPrimary}`);
  console.log(`    - Upload Status: ${uploadedImage.uploadStatus}`);
  console.log(`    - Disk Reference: ${uploadedImage.fileReference}`);

  // Verify file existence on disk
  if (!uploadedImage.fileReference) throw new Error('File reference missing');
  const diskPath = mediaService.getDiskFilePath(uploadedImage.fileReference);
  if (!fs.existsSync(diskPath)) throw new Error(`File was not saved to disk at: ${diskPath}`);
  console.log(`  ✓ File verified on physical disk: ${diskPath} (${fs.statSync(diskPath).size} bytes)`);

  // 3. Upload a Video Walkthrough Buffer to secure storage
  console.log('\n2. Testing Video Walkthrough Upload...');
  const fakeVideoBuffer = Buffer.from('FAKE_MP4_VIDEO_HEADER_DATA_1234567890');
  const uploadedVideo = await mediaService.uploadMedia(
    owner,
    testProp.id,
    fakeVideoBuffer,
    'compound_drone_tour.mp4',
    'video/mp4',
    '4K Drone Tour of Estate & Compound Gate',
    false // not primary
  );

  console.log(`  ✓ Video stored persistently:`);
  console.log(`    - Media ID: ${uploadedVideo.id}`);
  console.log(`    - URL: ${uploadedVideo.url}`);
  console.log(`    - Type: ${uploadedVideo.type}`);
  console.log(`    - Caption: "${uploadedVideo.caption}"`);
  console.log(`    - Is Primary: ${uploadedVideo.isPrimary}`);
  console.log(`    - Upload Status: ${uploadedVideo.uploadStatus}`);

  // 4. Test Caption and Primary Status Updates
  console.log('\n3. Testing Media Metadata & Primary Toggle Updates...');
  const updatedVideo = await mediaService.updateMedia(owner, testProp.id, uploadedVideo.id, {
    caption: 'Updated: 4K Drone Tour of Estate with Gate Access',
    isPrimary: true, // promote video to primary
  });
  console.log(`  ✓ Updated caption: "${updatedVideo.caption}"`);
  console.log(`  ✓ Promoted video to primary: ${updatedVideo.isPrimary}`);

  // Verify previous image is no longer primary
  const propAfterUpdate = await propertyRepository.findById(testProp.id);
  const prevImage = propAfterUpdate?.media.find((m) => m.id === uploadedImage.id);
  console.log(`  ✓ Previous image isPrimary correctly reset to: ${prevImage?.isPrimary}`);
  if (prevImage?.isPrimary) throw new Error('Expected previous image to no longer be primary');

  // 5. Test Media Reordering
  console.log('\n4. Testing Media Reordering...');
  const mediaIds = (propAfterUpdate?.media || []).map((m) => m.id);
  const reversedIds = [...mediaIds].reverse();
  const reordered = await mediaService.reorderMedia(owner, testProp.id, reversedIds);
  console.log(`  ✓ Reordered ${reordered.length} items. First item is now ID: ${reordered[0].id} (Order: ${reordered[0].order})`);
  if (reordered[0].id !== reversedIds[0]) throw new Error('Reordering mismatch');

  // 6. Test Media Lookup & Verification
  console.log('\n5. Testing Media Lookup by ID...');
  const lookup = await mediaService.findMediaById(uploadedImage.id);
  if (!lookup) throw new Error('Failed to find media by ID');
  console.log(`  ✓ Media lookup passed: Found media for property "${lookup.property.title}"`);

  // 7. Test Media Deletion & Disk Cleanup
  console.log('\n6. Testing Media Deletion & Secure File Cleanup...');
  const deleteRes = await mediaService.deleteMedia(owner, testProp.id, uploadedVideo.id);
  console.log(`  ✓ Video media deleted from repository: ${deleteRes}`);
  const videoDiskPath = mediaService.getDiskFilePath(uploadedVideo.fileReference!);
  if (fs.existsSync(videoDiskPath)) {
    throw new Error('Video file was not cleaned up from disk');
  }
  console.log(`  ✓ Video file successfully removed from disk: ${uploadedVideo.fileReference}`);

  console.log('\n====================================================');
  console.log('✅ ALL SECTION 7 PROPERTY MEDIA TESTS PASSED (100%)!');
  console.log('====================================================\n');
}

runSection7MediaTests().catch((err) => {
  console.error('❌ Section 7 Media Test failed:', err);
  process.exit(1);
});

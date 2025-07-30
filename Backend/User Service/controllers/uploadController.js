"use strict";

const { error } = require("console");
const { pool } = require("../config/db");
const { cloudinary_uploader } = require("../services/cloudinaryUploader");
const cloudinary = require("cloudinary").v2;

const upload_image = async (req, res) => {
  const userid = req.userid;
  let uploadedImageData = null;
  if (!req.file) {
    console.log("No file picture detected to upload");
    return res.status(400).json({
      message: "No file picture detected to upload",
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check if user has an existing photo
    const urlResult = await client.query(
      `SELECT user_photo FROM users WHERE user_id = $1`,
      [userid]
    );

    if (urlResult.rows.length > 0 && urlResult.rows[0].user_photo) {
      // If photo exists, remove from cloud and DB
      const publicIdResult = await client.query(
        `SELECT public_id FROM profileimage WHERE userid = $1`,
        [userid]
      );
      const publicId = publicIdResult.rows[0]?.public_id;
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      } else {
        throw error;
      }
      await client.query(`DELETE FROM profileimage WHERE userid = $1`, [
        userid,
      ]);
      await client.query(
        `UPDATE users SET user_photo = NULL WHERE user_id = $1`,
        [userid]
      );
    }

    // Upload new image
    const imageBuffer = req.file.buffer;
    uploadedImageData = await cloudinary_uploader(imageBuffer);

    // Update user table with image URL
    await client.query(`UPDATE users SET user_photo = $2 WHERE user_id = $1`, [
      userid,
      uploadedImageData.url,
    ]);
    // Insert into profileimage table
    await client.query(
      `INSERT INTO profileimage(userid, public_id) VALUES ($1, $2)`,
      [userid, uploadedImageData.public_id]
    );

    await client.query("COMMIT");

    return res.json({
      message: "Image uploaded successfully",
      data: uploadedImageData.url,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    if (uploadedImageData?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadedImageData.public_id);
        console.log("Rolled back uploaded image from Cloudinary due to error.");
      } catch (cleanupErr) {
        console.error(
          "Failed to cleanup uploaded image from Cloudinary:",
          cleanupErr
        );
      }
    }

    console.error("Error during image upload:", error);
    return res.status(500).json({
      message: "An error occurred while uploading the image",
    });
  } finally {
    client.release();
  }
};

module.exports = { upload_image };

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

// Configuración del cliente R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

/**
 * Sube un archivo a Cloudflare R2
 * @param {Buffer} fileBuffer - Buffer del archivo
 * @param {string} fileName - Nombre del archivo (con UUID)
 * @param {string} mimeType - Tipo MIME del archivo
 * @returns {Promise<string>} - Nombre del archivo subido
 */
async function uploadToR2(fileBuffer, fileName, mimeType) {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    await r2Client.send(command);
    console.log(`✅ Archivo subido a R2: ${fileName}`);
    return fileName;
  } catch (error) {
    console.error('❌ Error subiendo a R2:', error);
    throw new Error(`Error al subir archivo a R2: ${error.message}`);
  }
}

/**
 * Obtiene una URL firmada temporal para descargar un archivo
 * @param {string} fileName - Nombre del archivo
 * @param {number} expiresIn - Tiempo de expiración en segundos (default: 3600 = 1 hora)
 * @returns {Promise<string>} - URL firmada
 */
async function getDownloadUrl(fileName, expiresIn = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('❌ Error generando URL de descarga:', error);
    throw new Error(`Error al generar URL de descarga: ${error.message}`);
  }
}

/**
 * Elimina un archivo de R2
 * @param {string} fileName - Nombre del archivo a eliminar
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
async function deleteFromR2(fileName) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    await r2Client.send(command);
    console.log(`✅ Archivo eliminado de R2: ${fileName}`);
    return true;
  } catch (error) {
    console.error('❌ Error eliminando de R2:', error);
    throw new Error(`Error al eliminar archivo de R2: ${error.message}`);
  }
}

module.exports = {
  uploadToR2,
  getDownloadUrl,
  deleteFromR2,
};

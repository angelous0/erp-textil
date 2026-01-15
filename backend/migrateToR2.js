/**
 * Script para migrar archivos existentes del directorio local a Cloudflare R2
 * Uso: node migrateToR2.js
 */

const { uploadToR2 } = require('./r2Storage.js');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const UPLOADS_DIR = process.env.UPLOAD_DIR || '/app/backend/uploads';

async function migrateFiles() {
  console.log('🚀 Iniciando migración de archivos a Cloudflare R2...\n');
  
  // Verificar que el directorio existe
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log('❌ El directorio de uploads no existe:', UPLOADS_DIR);
    return;
  }
  
  // Listar archivos
  const files = fs.readdirSync(UPLOADS_DIR).filter(f => {
    const filePath = path.join(UPLOADS_DIR, f);
    return fs.statSync(filePath).isFile();
  });
  
  if (files.length === 0) {
    console.log('ℹ️  No hay archivos para migrar');
    return;
  }
  
  console.log(`📁 Encontrados ${files.length} archivos para migrar:\n`);
  
  let exitosos = 0;
  let fallidos = 0;
  
  for (const fileName of files) {
    const filePath = path.join(UPLOADS_DIR, fileName);
    
    try {
      // Leer archivo
      const fileBuffer = fs.readFileSync(filePath);
      
      // Detectar tipo MIME
      const mimeType = mime.lookup(fileName) || 'application/octet-stream';
      
      // Subir a R2
      console.log(`⏳ Subiendo: ${fileName} (${mimeType})`);
      await uploadToR2(fileBuffer, fileName, mimeType);
      
      exitosos++;
    } catch (error) {
      console.error(`❌ Error con ${fileName}:`, error.message);
      fallidos++;
    }
  }
  
  console.log('\n📊 Resumen de migración:');
  console.log(`   ✅ Exitosos: ${exitosos}`);
  console.log(`   ❌ Fallidos: ${fallidos}`);
  console.log(`   📁 Total: ${files.length}`);
  
  if (fallidos === 0) {
    console.log('\n🎉 ¡Migración completada exitosamente!');
    console.log('💡 Puedes eliminar los archivos locales manualmente si lo deseas.');
  } else {
    console.log('\n⚠️  Algunos archivos fallaron. Revisa los errores arriba.');
  }
}

// Ejecutar migración
migrateFiles().catch(console.error);

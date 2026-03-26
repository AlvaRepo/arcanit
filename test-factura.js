const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`ERROR: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', err => {
    errors.push(`PAGE ERROR: ${err.message}`);
  });

  try {
    console.log('🔍 Abriendo http://localhost:3000/login...\n');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    
    // Login
    console.log('🔐 Completando login...');
    await page.fill('input[id="email"]', 'admin@arcanit.com');
    await page.fill('input[id="password"]', '1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Login exitoso\n');
    
    // Ir a Nueva Factura
    console.log('📄 Navegando a Nueva Factura...');
    await page.goto('http://localhost:3000/dashboard/facturar');
    await page.waitForLoadState('networkidle');
    console.log('✅ Página de facturación cargada\n');
    
    // Buscar todos los botones y hacer click en el primero (Plataforma Streaming)
    console.log('🎮 Seleccionando preset...');
    const buttons = await page.$$('button');
    if (buttons.length > 0) {
      await buttons[0].click(); // Primer botón de preset
      console.log('✅ Preset seleccionado\n');
    }
    
    // Completar razón social (buscar input con placeholder de Twitch)
    console.log('📝 Completando datos...');
    const inputs = await page.$$('input');
    // El input de razón social es el último input de texto
    for (let i = inputs.length - 1; i >= 0; i--) {
      const placeholder = await inputs[i].getAttribute('placeholder');
      if (placeholder && placeholder.includes('Twitch')) {
        await inputs[i].fill('Twitch Interactive Inc.');
        break;
      }
    }
    
    // Completar monto
    const montoInput = await page.$('input[type="number"]');
    if (montoInput) {
      await montoInput.fill('500');
    }
    
    console.log('🔘 Haciendo click en Generar Factura...');
    // Buscar botón de generar
    const generarBtn = await page.$('button:has-text("Generar")');
    if (generarBtn) {
      await generarBtn.click();
      await page.waitForTimeout(3000);
    }
    
    // Verificar resultado
    const resultado = await page.$('text=Factura Generada');
    const errorMsg = await page.$('text=Error al generar');
    
    if (resultado) {
      console.log('\n✅ FACTURA GENERADA CORRECTAMENTE');
    } else if (errorMsg) {
      console.log('\n❌ ERROR AL GENERAR');
    } else {
      console.log('\n❓ VERIFICANDO RESULTADO...');
      const pageContent = await page.content();
      if (pageContent.includes('Factura Generada')) {
        console.log('✅ FACTURA GENERADA!');
      } else if (pageContent.includes('Error')) {
        console.log('❌ HAY ERROR');
      }
    }

    if (errors.length > 0) {
      console.log('\n❌ ERRORES:');
      errors.forEach(e => console.log(e));
    }

  } catch (err) {
    console.log('❌ ERROR:', err.message);
  }

  await browser.close();
})();
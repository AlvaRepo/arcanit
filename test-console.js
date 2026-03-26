const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Capturar errores de consola
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
    console.log('🔍 Abriendo http://localhost:3000...\n');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    console.log('✅ Página cargada\n');
    
    // Buscar botón de login
    const loginBtn = await page.$('a[href="/login"]');
    if (loginBtn) {
      console.log('🔐 Haciendo click en Iniciar Sesión...');
      await loginBtn.click();
      await page.waitForLoadState('networkidle');
      
      // Llenar formulario de login
      console.log('📝 Completando login...');
      await page.fill('input[type="email"]', 'admin@arcanit.com');
      await page.fill('input[type="password"]', '1234');
      await page.click('button[type="submit"]');
      
      // Esperarredirect a dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      console.log('✅ Login exitoso, redirigido a dashboard\n');
      
      // Ir a Nueva Factura
      console.log('📄 Navegando a Nueva Factura...');
      await page.click('text=Nueva Factura');
      await page.waitForLoadState('networkidle');
      console.log('✅ Página de facturación cargada\n');
    }

    // Mostrar errores capturados
    if (errors.length > 0) {
      console.log('❌ ERRORES ENCONTRADOS:\n');
      errors.forEach(e => console.log(e));
    } else {
      console.log('✅ SIN ERRORES EN CONSOLA');
    }

  } catch (err) {
    console.log('❌ ERROR DURANTE LA PRUEBA:', err.message);
  }

  await browser.close();
})();
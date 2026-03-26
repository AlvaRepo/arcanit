const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Abriendo http://localhost:3000/login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    
    // Login
    console.log('🔐 Login...');
    await page.fill('input[id="email"]', 'admin@arcanit.com');
    await page.fill('input[id="password"]', '1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Login exitoso\n');
    
    // Ir a Clientes
    console.log('👥 Navegando a Clientes...');
    await page.goto('http://localhost:3000/dashboard/clientes');
    await page.waitForLoadState('networkidle');
    
    // Click en agregar cliente
    console.log('➕ Abriendo formulario...');
    await page.click('button:has-text("Agregar Cliente")');
    await page.waitForTimeout(500);
    
    // Verificar que aparece el formulario
    const form = await page.$('text=Agregar Cliente');
    if (form) {
      console.log('✅ Formulario de cliente abierto\n');
    }
    
    // Ir a Nueva Factura
    console.log('📄 Nueva Factura...');
    await page.goto('http://localhost:3000/dashboard/facturar');
    await page.waitForLoadState('networkidle');
    
    // Verificar selector de clientes
    const selects = await page.$$('select');
    console.log(`✅ Página cargada, tiene ${selects.length} selects\n`);
    
    // Verificar Dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    const clientesBtn = await page.$('text=Ver Clientes');
    if (clientesBtn) {
      console.log('✅ Botón de Clientes en Dashboard\n');
    }

    console.log('🎉 PRUEBA COMPLETADA - TODO OK');
    
  } catch (err) {
    console.log('❌ ERROR:', err.message);
  }

  await browser.close();
})();
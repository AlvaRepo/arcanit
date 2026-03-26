---
name: arca-monotributo
description: >
  Sistema de facturación electrónica ARCA para Monotributistas Argentinos.
  Trigger: Cuando se trabaja en el proyecto ArcaNit o cualquier sistema de facturación para monotributistas.
license: Apache-2.0
metadata:
  author: ArcaNit
  version: "1.0"
---

## Cuándo Usar Este Skill

Este skill se activa cuando:
- El usuario es monotributista en Argentina
- Se necesita crear un sistema de facturación electrónica para monotributistas
- Se deben emitir comprobantes electrónicos tipo C, B o A
- Se integra con la API de ARCA/AFIP

## Reglas Fundamentales del Monotributo

### ⚠️ CÓDIGO SEGURO: No te equivoques de tipo de factura

| Tipo de Factura | Cuándo Usarla | Quien la Emite | Discrimina IVA |
|-----------------|---------------|----------------|----------------|
| **Factura C** | Consumo final, otro monotributista | Monotributista/Exento | ❌ NO |
| **Factura B** | Consumo final, responsable inscripto | Responsable Inscripto | ❌ NO (incluye IVA) |
| **Factura A** | Responsable inscripto a otro RI o monotributista | Responsable Inscripto | ✅ SÍ |
| **Factura E** | Exportación | Cualquiera | N/A |

### 🔑 Regla de Oro
> Un **monotributista** puede emitir:
> - **Factura C** a cualquier cliente (siempre)
> - **Factura B** solo si vende a un responsable inscripto que lo pide
> - **Factura A** solo si se convierte a Responsable Inscripto

## Datos Obligatorios para Facturar

Para emitir cualquier comprobante, necesitas:

### Del Emisor (Monotributista)
- CUIT (Clave Única de Identificación Tributaria)
- Clave Fiscal nivel 3+ (activada en ARCA)
- Punto de venta habilitado para facturación electrónica
- Servicio "Comprobantes en línea" activado

### Del Receptor
- Tipo de documento (CUIT=80, DNI=96, CUIL=86)
- Número de documento
- Razón social o nombre completo
- Domicilio (opcional para consumidor final)

## Tipos de Comprobantes - Códigos ARCA

### Códigos de Comprobante (CbteTipo)

| Código | Tipo | Uso |
|--------|------|-----|
| 1 | Factura A | Solo RI |
| 6 | Factura B | RI a consumidor |
| 11 | Factura C | Monotributista |
| 201 | Nota Crédito A | Solo RI |
| 206 | Nota Crédito B | RI a consumidor |
| 211 | Nota Crédito C | Monotributista |
| 202 | Nota Débito A | Solo RI |
| 206 | Nota Débito B | RI a consumidor |
| 212 | Nota Débito C | Monotributista |

### Códigos de Documento (DocTipo)

| Código | Tipo |
|--------|------|
| 80 | CUIT |
| 86 | CUIL |
| 96 | DNI |
| 99 | Sin documento (consumidor final anónimo) |

### Códigos de Concepto

| Código | Concepto |
|--------|----------|
| 1 | Productos |
| 2 | Servicios |
| 3 | Productos y Servicios |

## Estructura JSON para Crear Factura

### Factura C (Monotributista a Consumidor)

```javascript
const data = {
  CantReg: 1,           // Cantidad de comprobantes
  PtoVta: 1,            // Punto de venta (debe estar habilitado)
  CbteTipo: 11,         // 11 = Factura C
  Concepto: 2,          // 2 = Servicios
  DocTipo: 96,         // Tipo documento receptor
  DocNro: 12345678,    // Número documento
  CbteDesde: numero,   // Número siguiente
  CbteHasta: numero,
  CbteFch: 20260325,   // Fecha en formato YYYYMMDD
  ImpTotal: 1000,      // Total con IVA incluido (si corresponde)
  ImpTotConc: 0,       // Importe no gravado
  ImpNeto: 826.45,     // Neto gravado
  ImpIVA: 173.55,      // IVA 21% (solo si es RI, para C es 0)
  // Para Factura C, el IVA es 0 porque está integrado en el monotributo
};
```

### Factura B (Responsable Inscripto a Consumidor)

```javascript
const data = {
  CantReg: 1,
  PtoVta: 1,
  CbteTipo: 6,          // 6 = Factura B
  Concepto: 2,
  DocTipo: 80,
  DocNro: 20267565393, // CUIT del cliente
  CbteDesde: numero,
  CbteHasta: numero,
  CbteFch: 20260325,
  ImpTotal: 121,        // 100 + 21% IVA = 121
  ImpNeto: 100,
  ImpIVA: 21,
  // Para Factura B: el precio incluye IVA, se muestra discriminado
};
```

## Respuesta de ARCA

### Caso Éxito
```json
{
  "FECAESolicitarResult": {
    "FeCabResp": {
      "CantReg": 1,
      "PtoVta": 1,
      "CbteTipo": 11,
      "Resultado": "A",  // Aprobado
      "Reproceso": "N"
    },
    "FeDetResp": {
      "FECAEDetResponse": {
        "Resultado": "A",
        "CAE": "12345678901234",
        "CAEFchVto": "20260425"
      }
    }
  }
}
```

### Caso Error
```json
{
  "FECAESolicitarResult": {
    "FeCabResp": {
      "Resultado": "R",  // Rechazado
      "Reproceso": "N"
    },
    "Errors": {
      "Err": {
        "Code": 10016,
        "Msg": "El número o fecha del comprobante no corresponde al próximo a autorizar"
      }
    }
  }
}
```

## Límites Monotributo 2026 ( Vigente desde Feb 2026 )

| Categoría | Ingresos Brutos Anual |
|-----------|----------------------|
| A | $10.277.988 |
| B | $15.058.448 |
| C | $21.113.865 |
| D | $26.212.853 |
| E | $30.840.480 |
| F | $38.624.048 |
| G | $46.277.093 |
| H | $70.113.407 |
| I | $78.479.216 |
| J | $89.872.640 |
| K | $108.357.084 |

⚠️ **IMPORTANTE**: Si superás el límite, debés pasar a Responsable Inscripto.

## Integración con Afip SDK

```javascript
const Afip = require('@afipsdk/afip.js');

const afip = new Afip({
    access_token: 'TU_ACCESS_TOKEN',
    CUIT: 20123456789  // TU CUIT COMO MONOTRIBUTISTA
});

// Obtener último número de comprobante
const lastVoucher = await afip.ElectronicBilling.getLastVoucher(puntoVenta, tipoComprobante);

// Crear factura C
const res = await afip.ElectronicBilling.createVoucher(data);
console.log(res.CAE);      // Código de Autorización Electrónico
console.log(res.CAEFchVto); // Fecha vencimiento CAE
```

## Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| 10016 | Número de comprobante incorrecto | Usar getLastVoucher para obtener el siguiente |
| 10003 | CUIT no autorizado en wsfe | Activar servicio "Comprobantes en línea" en ARCA |
| 10001 | Certificado vencido | Renovar certificado digital |
| 10005 | Punto de venta no existe | Crear punto de venta en ARCA |

## Commands Útiles

```bash
# Verificar último comprobante
npm install @afipsdk/afip.js
```

## Recursos

- **Afip SDK**: https://docs.afipsdk.com
- **ARCA WebServices**: https://www.afip.gob.ar/ws/documentacion/ws-factura-electronica.asp
- **Facturador ARCA**: https://facturador.afip.gob.ar
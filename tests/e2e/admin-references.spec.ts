import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { browserSignIn, expectToast } from './support/browser-admin.ts'
// Phones say "Simpan coach"; the desktop editor beside the list says "Simpan".
const saveName = (save: string) => new RegExp(`^(${save}|Simpan)$`)
for (const [path, add, edit, save] of [['coaches','Tambah coach','Ubah coach','Simpan coach'],['venues','Tambah lokasi','Ubah lokasi','Simpan lokasi'],['levels','Tambah level','Ubah level','Simpan level']] as const) {
  test(`reference ${path}: create, reload, edit, preserve values on failure and confirm discard`, async ({ page }) => {
    await browserSignIn(page)
    await page.goto(`/admin/${path}/new`)
    const name = 'Contoh uji ' + randomUUID()
    await expect(page.getByRole('heading', { name: add })).toBeVisible()
    await page.getByRole('button', { name: saveName(save) }).click()
    await expect(page.getByLabel(/^Nama (coach|lokasi|level)$/)).toBeFocused()
    await page.getByLabel(/^Nama (coach|lokasi|level)$/).fill(name)
    if (path === 'venues') await page.getByLabel('Alamat (opsional)').fill('Alamat contoh pengujian')
    await page.route(`**/api/admin/${path}`, route => route.request().method() === 'POST' ? route.abort() : route.continue())
    await page.getByRole('button', { name: saveName(save) }).click()
    await expect(page.getByRole('alert')).toContainText('Isian tetap tersedia')
    await expect(page.getByLabel(/^Nama (coach|lokasi|level)$/)).toHaveValue(name)
    await page.unroute(`**/api/admin/${path}`)
    await page.getByRole('button', { name: saveName(save) }).click()
    await expectToast(page, `${name} ditambahkan.`)
    await page.reload(); await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
    // Phones open the record from its row's "Ubah" link; on desktop the row itself is the link to the editor beside it.
    if ((page.viewportSize()?.width ?? 0) >= 1024) await page.getByRole('list').getByRole('link', { name: new RegExp('^' + name) }).click()
    else await page.locator('li').filter({ has: page.getByRole('heading', { name, exact: true }) }).getByRole('link', { name: new RegExp(edit) }).click()
    await page.getByLabel(/^Nama (coach|lokasi|level)$/).fill(name + ' edited')
    // The rail's Kelola on wide screens, the band's "Kelola › …" back link on phones.
    await page.getByRole('link', { name: /^Kelola( ›|$)/ }).first().click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tetap mengedit' })).toBeFocused()
    await page.getByRole('button', { name: 'Tetap mengedit' }).click()
    await expect(page.getByLabel(/^Nama (coach|lokasi|level)$/)).toHaveValue(name + ' edited')
    await page.getByRole('button', { name: saveName(save) }).click()
    await expectToast(page, `${name} edited tersimpan.`)
    await expect(page.getByRole('heading', { name: name + ' edited', exact: true }).first()).toBeVisible()
  })
}
test('E11 sign-out asks before losing unsaved entries and clears create drafts only on confirmed sign-out', async ({ page }) => {
  await browserSignIn(page); await page.goto('/admin/coaches/new')
  await page.getByLabel(/^Nama (coach|lokasi|level)$/).fill('Contoh unsaved coach')
  await page.getByRole('button', { name: 'Keluar', exact: true }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await page.getByRole('button', { name: 'Tetap mengedit' }).click()
  await expect(page.getByLabel(/^Nama (coach|lokasi|level)$/)).toHaveValue('Contoh unsaved coach')
  await page.getByRole('button', { name: 'Keluar', exact: true }).click(); await page.getByRole('button', { name: 'Buang perubahan', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/sign-in$/)
  expect(await page.evaluate(() => sessionStorage.getItem('stc.sessionDraft'))).toBeNull()
})

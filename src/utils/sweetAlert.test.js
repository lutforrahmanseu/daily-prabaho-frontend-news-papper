import { test } from 'node:test';
import assert from 'node:assert';
import sweetAlert, {
  subscribeSweetAlert,
  resolveCurrentAlert,
  _resetSweetAlerts
} from './sweetAlert.js';

test('sweetAlert resolves safely when no UI host is subscribed (Node/SSR)', async () => {
  _resetSweetAlerts();
  const res = await sweetAlert.confirm('Delete item?');
  assert.strictEqual(res.isConfirmed, false);
  assert.strictEqual(res.isDismissed, true);
  assert.strictEqual(res.dismiss, 'no-host');
});

test('sweetAlert.confirm & confirmDelete queue FIFO and resolve confirmed vs cancelled promises', async () => {
  _resetSweetAlerts();
  let latest = null;
  const unsub = subscribeSweetAlert((snapshot) => {
    latest = snapshot;
  });

  const confirmPromise = sweetAlert.confirm({
    title: 'নিশ্চিতকরণ',
    text: 'আপনি কি প্রকাশ করতে চান?'
  });
  const deletePromise = sweetAlert.confirmDelete('প্রথম পাতা');

  assert.strictEqual(latest.queueLength, 2);
  assert.strictEqual(latest.current.title, 'নিশ্চিতকরণ');
  assert.strictEqual(latest.current.showCancelButton, true);

  resolveCurrentAlert({ isConfirmed: true });
  const firstRes = await confirmPromise;
  assert.strictEqual(firstRes.isConfirmed, true);
  assert.strictEqual(firstRes.isDismissed, false);

  assert.strictEqual(latest.queueLength, 1);
  assert.strictEqual(latest.current.confirmVariant, 'danger');
  assert.ok(latest.current.text.includes('প্রথম পাতা'));

  resolveCurrentAlert({ isConfirmed: false, dismiss: 'cancel' });
  const secondRes = await deletePromise;
  assert.strictEqual(secondRes.isConfirmed, false);
  assert.strictEqual(secondRes.isDismissed, true);
  assert.strictEqual(secondRes.dismiss, 'cancel');

  assert.strictEqual(latest.current, null);
  unsub();
});

test('sweetAlert.success and sweetAlert.error configure expected defaults', async () => {
  _resetSweetAlerts();
  let seen = [];
  const unsub = subscribeSweetAlert(({ current }) => {
    if (current) seen.push(current);
  });

  const sPromise = sweetAlert.success('সফলভাবে সংরক্ষিত হয়েছে');
  resolveCurrentAlert({ isConfirmed: true });
  await sPromise;

  const ePromise = sweetAlert.error('সার্ভার ত্রুটি', 'তথ্য সংরক্ষণ করা যায়নি');
  resolveCurrentAlert({ isConfirmed: false, dismiss: 'close' });
  await ePromise;

  assert.strictEqual(seen[0].icon, 'success');
  assert.strictEqual(seen[0].text, 'সফলভাবে সংরক্ষিত হয়েছে');
  assert.ok(seen[0].timer > 0);

  assert.strictEqual(seen[1].icon, 'error');
  assert.strictEqual(seen[1].title, 'সার্ভার ত্রুটি');
  assert.strictEqual(seen[1].text, 'তথ্য সংরক্ষণ করা যায়নি');
  assert.strictEqual(seen[1].timer, 0);
  unsub();
});


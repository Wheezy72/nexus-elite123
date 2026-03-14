import { beforeEach, describe, expect, it } from 'vitest';
import { pinLockService } from '@/services/pinLockService';

describe('pinLockService', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    pinLockService.clearPin();
  });

  it('sets and unlocks a pin', async () => {
    await pinLockService.setPin('1234');
    pinLockService.lock();

    expect(pinLockService.hasPin()).toBe(true);
    expect(pinLockService.isUnlocked()).toBe(false);

    await pinLockService.unlock('1234');

    expect(pinLockService.isUnlocked()).toBe(true);
  });

  it('rejects wrong pins', async () => {
    await pinLockService.setPin('1234');
    pinLockService.lock();

    await expect(pinLockService.unlock('9999')).rejects.toThrow('Wrong PIN');
  });
});

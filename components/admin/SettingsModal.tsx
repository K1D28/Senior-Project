import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ShieldCheck } from 'lucide-react';
import { User } from '../../types';
import { BACKEND_URL } from '../../utils/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

type Step = 'loading' | 'idle' | 'enrolling' | 'disabling';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [step, setStep] = useState<Step>('loading');
  const [isEnabled, setIsEnabled] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setCode('');
    setStep('loading');
    axios.get(`${BACKEND_URL}/api/2fa/status`, { headers: authHeaders(), withCredentials: true })
      .then(res => {
        setIsEnabled(!!res.data.enabled);
        setStep('idle');
      })
      .catch(() => {
        setError('Failed to load 2FA status.');
        setStep('idle');
      });
  }, [isOpen]);

  const resetToIdle = () => {
    setStep('idle');
    setQrCodeDataUrl(null);
    setSecret(null);
    setCode('');
    setError('');
  };

  const handleStartEnroll = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/2fa/setup`, {}, { headers: authHeaders(), withCredentials: true });
      setQrCodeDataUrl(res.data.qrCodeDataUrl);
      setSecret(res.data.secret);
      setStep('enrolling');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to start 2FA setup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmEnable = async () => {
    if (!code.trim()) {
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await axios.post(`${BACKEND_URL}/api/2fa/verify`, { code }, { headers: authHeaders(), withCredentials: true });
      setIsEnabled(true);
      resetToIdle();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDisable = async () => {
    if (!code.trim()) {
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await axios.post(`${BACKEND_URL}/api/2fa/disable`, { code }, { headers: authHeaders(), withCredentials: true });
      setIsEnabled(false);
      resetToIdle();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetToIdle();
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
    onClose();
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/auth/change-password`,
        { currentPassword, newPassword },
        { headers: authHeaders(), withCredentials: true }
      );
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err?.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Settings" size="md">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-background">
          <h3 className="font-semibold text-text-dark">Change Password</h3>
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            autoComplete="current-password"
          />
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            autoComplete="new-password"
          />
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
          />
          {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
          {passwordSuccess && <p className="text-sm text-green-600">{passwordSuccess}</p>}
          <div className="flex justify-end">
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-background">
          <ShieldCheck className="text-primary flex-shrink-0 mt-1" size={22} />
          <div className="flex-1">
            <h3 className="font-semibold text-text-dark">Two-Factor Authentication</h3>
            <p className="text-sm text-text-light mt-1">
              Use a time-based one-time password app (e.g. Google Authenticator) to require a
              verification code each time you log in.
            </p>
          </div>
        </div>

        {step === 'loading' && (
          <p className="text-sm text-text-light">Loading...</p>
        )}

        {step === 'idle' && (
          <>
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-medium text-text-dark">
                {isEnabled ? '2FA is enabled' : '2FA is disabled'}
              </span>
              {isEnabled ? (
                <Button onClick={() => setStep('disabling')} className="bg-red-500 text-white hover:bg-red-600">
                  Disable
                </Button>
              ) : (
                <Button onClick={handleStartEnroll} disabled={isSubmitting}>
                  Enable
                </Button>
              )}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </>
        )}

        {step === 'enrolling' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text-dark">
              Scan this QR code with Google Authenticator (or any TOTP app), then enter the 6-digit
              code it generates.
            </p>
            {qrCodeDataUrl && (
              <img src={qrCodeDataUrl} alt="2FA QR code" className="w-48 h-48 mx-auto border border-border rounded-lg" />
            )}
            {secret && (
              <p className="text-xs text-text-light text-center break-all">
                Can't scan? Enter this key manually: <span className="font-mono">{secret}</span>
              </p>
            )}
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              maxLength={6}
              inputMode="numeric"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button onClick={resetToIdle} variant="secondary">Cancel</Button>
              <Button onClick={handleConfirmEnable} disabled={isSubmitting}>Verify &amp; Enable</Button>
            </div>
          </div>
        )}

        {step === 'disabling' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text-dark">
              Enter a current code from your authenticator app to confirm disabling 2FA.
            </p>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              maxLength={6}
              inputMode="numeric"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button onClick={resetToIdle} variant="secondary">Cancel</Button>
              <Button onClick={handleConfirmDisable} disabled={isSubmitting} className="bg-red-500 text-white hover:bg-red-600">
                Confirm Disable
              </Button>
            </div>
          </div>
        )}

        {step !== 'enrolling' && step !== 'disabling' && (
          <div className="flex justify-end pt-2 border-t border-border">
            <Button onClick={handleClose} variant="secondary">Close</Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SettingsModal;


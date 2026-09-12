import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthExperience from './AuthExperience';
import AccountSetupGate from './AccountSetupGate';
import { signIn, signUp, resetPassword, updatePassword, resendConfirmation, createProfile, createInitialClient, supabase } from './supabase';
import { buildSignupSetup, completeAccountSetup, finishAccountSetupWithoutLogo, getPendingSetup, updateAccountSetupMetadata } from './accountSetup';
import { saveLogoDraft } from './logoDraftStore';

// Every service is mocked: these checks never create accounts or send emails.
jest.mock('./supabase', () => ({
  signIn: jest.fn(),
  signUp: jest.fn(),
  resetPassword: jest.fn(),
  updatePassword: jest.fn(),
  resendConfirmation: jest.fn(),
  createProfile: jest.fn(),
  createInitialClient: jest.fn(),
  supabase: { from: jest.fn(), storage: { from: jest.fn() } },
}));
jest.mock('./accountSetup', () => ({
  buildSignupSetup: jest.fn(), completeAccountSetup: jest.fn(), finishAccountSetupWithoutLogo: jest.fn(),
  getPendingSetup: jest.fn(), updateAccountSetupMetadata: jest.fn(),
}));
jest.mock('./logoDraftStore', () => ({ saveLogoDraft: jest.fn(), clearLogoDraft: jest.fn() }));

const TEST_PASSWORD = 'Only-for-local-tests-42!';
const INITIAL_CLIENT_ID = '10000000-0000-4000-8000-000000000001';

function Harness({ initialPage = 'register', ...props }) {
  const [page, setPage] = useState(initialPage);
  return <AuthExperience authPage={page} setAuthPage={setPage} {...props} />;
}

function continueToAccount({ yearly = false, multipleIndustries = false } = {}) {
  fireEvent.click(screen.getByRole('button', { name: /Business or brand/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Restaurant or café' }));
  if (multipleIndustries) fireEvent.click(screen.getByRole('button', { name: 'Hotel or hospitality' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue', exact: true }));
  if (yearly) fireEvent.click(screen.getByRole('button', { name: /Yearly/ }));
  fireEvent.click(screen.getByRole('button', { name: /^Professional/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue', exact: true }));
}

function fillAccount() {
  fireEvent.change(screen.getByLabelText('Organisation name'), { target: { value: '  Test Harbour  ' } });
  fireEvent.change(screen.getByLabelText('Your full name'), { target: { value: '  Test Person  ' } });
  fireEvent.change(screen.getByLabelText('Work email'), { target: { value: 'HELLO@example.test' } });
  fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: TEST_PASSWORD } });
  fireEvent.click(screen.getByRole('checkbox', { name: /I agree to the/ }));
}

async function submitCompleteAccount(options) {
  continueToAccount(options);
  fillAccount();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Create account', exact: true })); });
  await waitFor(() => expect(signUp).toHaveBeenCalledTimes(1));
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  window.scrollTo = jest.fn();
  Element.prototype.scrollTo = jest.fn();
  signUp.mockResolvedValue({ data: { user: { id: 'test-user' }, session: null }, error: null });
  signIn.mockResolvedValue({ data: { user: { id: 'test-user' }, session: { access_token: 'test-token', user: { id: 'test-user' } } }, error: null });
  resetPassword.mockResolvedValue({ data: {}, error: null });
  updatePassword.mockResolvedValue({ data: {}, error: null });
  resendConfirmation.mockResolvedValue({ data: {}, error: null });
  saveLogoDraft.mockResolvedValue(undefined);
  getPendingSetup.mockImplementation(user => user?.user_metadata?.tawaslo_setup || null);
  completeAccountSetup.mockImplementation(async user => ({ status: 'ready', user }));
  finishAccountSetupWithoutLogo.mockImplementation(async user => ({ status: 'ready', user }));
  updateAccountSetupMetadata.mockImplementation(async user => user);
  buildSignupSetup.mockImplementation(({ fullName, companyName, accountType, selectedPlan, billing, industries, logoFile }) => ({
    version: 1,
    name: fullName.trim(),
    companyName: companyName.trim(),
    accountType,
    selectedPlan,
    billing,
    industries: [...industries],
    initialClientId: INITIAL_CLIENT_ID,
    logo: logoFile ? { name: logoFile.name, type: logoFile.type, size: logoFile.size } : null,
    createdAt: '2026-09-11T00:00:00.000Z',
  }));
});

afterEach(() => {
  cleanup();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('signup requires an account type and at least one industry before continuing', () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: 'Continue', exact: true }));
  expect(screen.getByText('Choose the option that best matches how you work.')).toBeInTheDocument();
  expect(screen.getByText('Choose at least one industry for the first workspace.')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'How do you work?' })).toBeInTheDocument();
  expect(signUp).not.toHaveBeenCalled();
});

test('selected industries, plan, and billing period survive moving back through signup', () => {
  render(<Harness />);
  continueToAccount({ yearly: true, multipleIndustries: true });
  fireEvent.click(screen.getByRole('button', { name: 'Back', exact: true }));
  expect(screen.getByRole('button', { name: /Yearly/ })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: /^Professional/ })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Back', exact: true }));
  expect(screen.getByRole('button', { name: 'Restaurant or café' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Hotel or hospitality' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Restaurant or café' }));
  expect(screen.getByRole('button', { name: 'Restaurant or café' })).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByRole('button', { name: 'Hotel or hospitality' })).toHaveAttribute('aria-pressed', 'true');
});

test('final signup validates account details and terms without contacting authentication', () => {
  render(<Harness />);
  continueToAccount();
  fireEvent.click(screen.getByRole('button', { name: 'Create account', exact: true }));
  expect(screen.getByLabelText('Organisation name')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByLabelText('Your full name')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByLabelText('Work email')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByLabelText('Password', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByText('Agree to the Terms and Privacy Policy to create the account.')).toBeInTheDocument();
  expect(signUp).not.toHaveBeenCalled();
});

test('signup saves every selected industry and yearly billing with auth metadata, then waits for confirmation', async () => {
  const setIsAuthed = jest.fn();
  render(<Harness setIsAuthed={setIsAuthed} />);
  await submitCompleteAccount({ yearly: true, multipleIndustries: true });
  expect(buildSignupSetup).toHaveBeenCalledWith(expect.objectContaining({
    accountType: 'corporate', selectedPlan: 'professional', billing: 'yearly',
    industries: ['restaurant', 'hospitality'],
  }));
  expect(signUp).toHaveBeenCalledWith('hello@example.test', TEST_PASSWORD, 'Test Person', expect.objectContaining({
    name: 'Test Person', companyName: 'Test Harbour', accountType: 'corporate',
    selectedPlan: 'professional', billing: 'yearly', industries: ['restaurant', 'hospitality'],
    initialClientId: INITIAL_CLIENT_ID,
  }));
  expect(await screen.findByRole('heading', { name: 'Check your email.' })).toBeInTheDocument();
  expect(screen.getByText('hello@example.test')).toBeInTheDocument();
  expect(setIsAuthed).not.toHaveBeenCalled();
  expect(createProfile).not.toHaveBeenCalled();
  expect(createInitialClient).not.toHaveBeenCalled();
  expect(supabase.from).not.toHaveBeenCalled();
  expect(supabase.storage.from).not.toHaveBeenCalled();
});

test('the logo is saved as a local draft before signup, with no pre-confirmation upload', async () => {
  render(<Harness />);
  continueToAccount();
  fillAccount();
  const file = new File(['test-image-bytes'], 'test-logo.png', { type: 'image/png' });
  fireEvent.change(screen.getByLabelText('Organisation logo'), { target: { files: [file] } });
  await screen.findByRole('img', { name: 'Selected organisation logo' });
  fireEvent.click(screen.getByRole('button', { name: 'Create account', exact: true }));
  await screen.findByRole('heading', { name: 'Check your email.' });
  expect(saveLogoDraft).toHaveBeenCalledWith(INITIAL_CLIENT_ID, file);
  expect(saveLogoDraft.mock.invocationCallOrder[0]).toBeLessThan(signUp.mock.invocationCallOrder[0]);
  expect(signUp.mock.calls[0][3].logo).toEqual({ name: file.name, type: file.type, size: file.size });
  expect(supabase.storage.from).not.toHaveBeenCalled();
});

test('an immediate authenticated signup proceeds to the parent workspace setup gate', async () => {
  signUp.mockResolvedValueOnce({ data: { user: { id: 'test-user' }, session: { access_token: 'test-token', user: { id: 'test-user' } } }, error: null });
  const setIsAuthed = jest.fn();
  render(<Harness setIsAuthed={setIsAuthed} />);
  await submitCompleteAccount();
  await waitFor(() => expect(setIsAuthed).toHaveBeenCalledWith(true));
  expect(screen.queryByRole('heading', { name: 'Check your email.' })).not.toBeInTheDocument();
  expect(createProfile).not.toHaveBeenCalled();
  expect(createInitialClient).not.toHaveBeenCalled();
});

test('confirmation resend is rate-limited in the UI and uses the normalized email', async () => {
  jest.useFakeTimers();
  render(<Harness />);
  await submitCompleteAccount();
  await screen.findByRole('heading', { name: 'Check your email.' });
  for (let second = 0; second < 60; second++) act(() => { jest.advanceTimersByTime(1000); });
  const resend = screen.getByRole('button', { name: 'Resend confirmation email', exact: true });
  expect(resend).toBeEnabled();
  await act(async () => { fireEvent.click(resend); });
  await waitFor(() => expect(resendConfirmation).toHaveBeenCalledWith('hello@example.test'));
  await waitFor(() => expect(screen.getByRole('button', { name: /Resend in \d+s/ })).toBeDisabled());
  fireEvent.click(screen.getByRole('button', { name: /Resend in \d+s/ }));
  expect(resendConfirmation).toHaveBeenCalledTimes(1);
  for (let second = 0; second < 60; second++) act(() => { jest.advanceTimersByTime(1000); });
  expect(screen.getByRole('button', { name: 'Resend confirmation email', exact: true })).toBeEnabled();
});

test('sign-in validation prevents an empty request', () => {
  render(<Harness initialPage="login" />);
  fireEvent.click(screen.getByRole('button', { name: 'Sign in securely' }));
  expect(screen.getByLabelText('Email address')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByLabelText('Password', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  expect(signIn).not.toHaveBeenCalled();
});

test('unconfirmed sign-in offers the confirmation journey rather than workspace access', async () => {
  signIn.mockResolvedValueOnce({ data: { user: null, session: null }, error: { code: 'email_not_confirmed', message: 'Email not confirmed' } });
  const setIsAuthed = jest.fn();
  render(<Harness initialPage="login" setIsAuthed={setIsAuthed} />);
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'HELLO@example.test' } });
  fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: TEST_PASSWORD } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in securely' }));
  expect(await screen.findByRole('heading', { name: 'Check your email.' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Resend confirmation email|Resend in \d+s/ })).toBeInTheDocument();
  expect(setIsAuthed).not.toHaveBeenCalled();
});

test('forgot-password result does not disclose whether the email has an account', async () => {
  render(<Harness initialPage="forgot" />);
  fireEvent.change(screen.getByLabelText('Account email'), { target: { value: 'UNKNOWN@example.test' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send recovery link' }));
  expect(await screen.findByRole('heading', { name: 'Check your inbox.' })).toBeInTheDocument();
  expect(screen.getByText(/If an account exists for/)).toBeInTheDocument();
  expect(resetPassword).toHaveBeenCalledWith('unknown@example.test');
});

test('an unverified or expired recovery link cannot show a password update form', () => {
  render(<Harness initialPage="recovery" recoveryVerified={false} authLinkError />);
  expect(screen.queryByLabelText('New password', { exact: true })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Update password' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Request a new link' }));
  expect(screen.getByRole('heading', { name: 'Reset your password.' })).toBeInTheDocument();
  expect(updatePassword).not.toHaveBeenCalled();
});

test('verified recovery rejects mismatched passwords before updating the account', () => {
  render(<Harness initialPage="recovery" recoveryVerified />);
  fireEvent.change(screen.getByLabelText('New password', { exact: true }), { target: { value: TEST_PASSWORD } });
  fireEvent.change(screen.getByLabelText('Confirm new password', { exact: true }), { target: { value: 'different-test-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
  expect(screen.getByText('The passwords do not match.')).toBeInTheDocument();
  expect(updatePassword).not.toHaveBeenCalled();
});

test('successful verified recovery clears the fields and continues only when requested', async () => {
  const setIsAuthed = jest.fn();
  const setRecovery = jest.fn();
  render(<Harness initialPage="recovery" recoveryVerified setIsAuthed={setIsAuthed} setRecovery={setRecovery} />);
  fireEvent.change(screen.getByLabelText('New password', { exact: true }), { target: { value: TEST_PASSWORD } });
  fireEvent.change(screen.getByLabelText('Confirm new password', { exact: true }), { target: { value: TEST_PASSWORD } });
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
  expect(await screen.findByRole('heading', { name: 'You are secure again.' })).toBeInTheDocument();
  expect(updatePassword).toHaveBeenCalledWith(TEST_PASSWORD);
  expect(screen.queryByDisplayValue(TEST_PASSWORD)).not.toBeInTheDocument();
  expect(setIsAuthed).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Continue to workspace' }));
  expect(setRecovery).toHaveBeenCalledWith(false);
  expect(setIsAuthed).toHaveBeenCalledWith(true);
});

test('repeat submits cannot create a second account while the first request is pending', async () => {
  let finishSignup;
  signUp.mockImplementationOnce(() => new Promise(resolve => { finishSignup = resolve; }));
  render(<Harness />);
  continueToAccount();
  fillAccount();
  const form = screen.getByRole('button', { name: 'Create account', exact: true }).closest('form');
  fireEvent.submit(form);
  fireEvent.submit(form);
  expect(signUp).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Creating account…' })).toBeDisabled();
  await act(async () => { finishSignup({ data: { user: { id: 'test-user' }, session: null }, error: null }); });
  expect(screen.getByRole('heading', { name: 'Check your email.' })).toBeInTheDocument();
});

test('recovery errors override an otherwise verified flag', () => {
  render(<Harness initialPage="recovery" recoveryVerified authLinkError />);
  expect(screen.queryByLabelText('New password', { exact: true })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Request a new link' })).toBeInTheDocument();
  expect(updatePassword).not.toHaveBeenCalled();
});

test('repeat recovery submits cannot update the password twice while saving', async () => {
  let finishUpdate;
  updatePassword.mockImplementationOnce(() => new Promise(resolve => { finishUpdate = resolve; }));
  render(<Harness initialPage="recovery" recoveryVerified />);
  fireEvent.change(screen.getByLabelText('New password', { exact: true }), { target: { value: TEST_PASSWORD } });
  fireEvent.change(screen.getByLabelText('Confirm new password', { exact: true }), { target: { value: TEST_PASSWORD } });
  const form = screen.getByRole('button', { name: 'Update password' }).closest('form');
  fireEvent.submit(form);
  fireEvent.submit(form);
  expect(updatePassword).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Updating password…' })).toBeDisabled();
  await act(async () => { finishUpdate({ data: {}, error: null }); });
  expect(screen.getByRole('heading', { name: 'You are secure again.' })).toBeInTheDocument();
});

const GATE_USER = {
  id: 'test-user',
  user_metadata: {
    tawaslo_setup: {
      version: 1, initialClientId: INITIAL_CLIENT_ID, companyName: 'Test Harbour',
      selectedPlan: 'professional', billing: 'yearly', industries: ['restaurant', 'hospitality'],
    },
  },
};

test('the workspace gate allows entry only after setup finishes and the user continues', async () => {
  let finishSetup;
  completeAccountSetup.mockImplementationOnce(() => new Promise(resolve => { finishSetup = resolve; }));
  const onReady = jest.fn();
  render(<AccountSetupGate user={GATE_USER} onReady={onReady} onSignOut={jest.fn()} />);
  expect(completeAccountSetup).toHaveBeenCalledWith(GATE_USER);
  expect(screen.queryByRole('button', { name: 'Continue to workspace' })).not.toBeInTheDocument();
  expect(onReady).not.toHaveBeenCalled();
  await act(async () => { finishSetup({ status: 'ready', user: GATE_USER }); });
  expect(screen.getByRole('heading', { name: 'Your workspace is ready.' })).toBeInTheDocument();
  expect(screen.getByText('Yearly · no charge today')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Continue to workspace' }));
  expect(onReady).toHaveBeenCalledWith(GATE_USER);
});

test('a failed workspace save offers retry without creating another account', async () => {
  completeAccountSetup.mockRejectedValueOnce(new Error('mock network failure'));
  const onReady = jest.fn();
  render(<AccountSetupGate user={GATE_USER} onReady={onReady} onSignOut={jest.fn()} />);
  expect(await screen.findByRole('button', { name: 'Retry workspace setup' })).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent('there is no need to create another account');
  expect(onReady).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Retry workspace setup' }));
  expect(await screen.findByRole('heading', { name: 'Your workspace is ready.' })).toBeInTheDocument();
  expect(completeAccountSetup).toHaveBeenCalledTimes(2);
  expect(signUp).not.toHaveBeenCalled();
});

test('a missing logo can be explicitly deferred without discarding account details', async () => {
  completeAccountSetup.mockResolvedValueOnce({ status: 'logo-required', user: GATE_USER, setup: GATE_USER.user_metadata.tawaslo_setup });
  const onReady = jest.fn();
  render(<AccountSetupGate user={GATE_USER} onReady={onReady} onSignOut={jest.fn()} />);
  expect(await screen.findByRole('button', { name: 'Choose logo again' })).toBeInTheDocument();
  expect(onReady).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Add the logo later' }));
  expect(await screen.findByRole('heading', { name: 'Your workspace is ready.' })).toBeInTheDocument();
  expect(finishAccountSetupWithoutLogo).toHaveBeenCalledWith(GATE_USER);
  expect(screen.getByText('Test Harbour')).toBeInTheDocument();
  expect(onReady).not.toHaveBeenCalled();
});

test('account lookup failure stays at the gate and retries lookup, not provisioning', () => {
  const onRetry = jest.fn();
  render(<AccountSetupGate loadingOnly loadError="We could not verify your session." onRetry={onRetry} onSignOut={jest.fn()} />);
  expect(screen.getByRole('alert')).toHaveTextContent('We could not verify your session.');
  expect(completeAccountSetup).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Continue to workspace' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(onRetry).toHaveBeenCalledTimes(1);
});

test('normal sign-in welcomes users with the decorative happy boy-and-girl pair', () => {
  render(<Harness initialPage="login" />);
  const pair = document.querySelector('.ax-login-heading .ax-welcome-duo[data-mood="happy"]');
  expect(pair).toHaveAttribute('aria-hidden', 'true');
  const characters = pair.querySelectorAll('.ax-duo-character');
  expect(characters).toHaveLength(2);
  expect(Array.from(characters, character => character.getAttribute('data-character'))).toEqual(['boy', 'girl']);
  expect(pair.querySelector('img, svg, button, a')).not.toBeInTheDocument();
  expect(document.querySelector('.ax-login-duo[data-mood="teary"]')).not.toBeInTheDocument();
  expect(document.querySelector('.ax-login-tears')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Welcome back.' })).toBeInTheDocument();
  expect(signIn).not.toHaveBeenCalled();
});

test('the duo looks down for email and covers their eyes for password entry', () => {
  render(<Harness initialPage="login" />);
  const email = screen.getByLabelText('Email address');
  const password = screen.getByLabelText('Password', { exact: true });

  fireEvent.focus(email);
  expect(document.querySelector('.ax-welcome-duo[data-mood="look-down"]')).toBeInTheDocument();
  fireEvent.change(email, { target: { value: 'hello@example.test' } });
  expect(document.querySelector('.ax-welcome-duo[data-mood="look-down"]')).toBeInTheDocument();

  fireEvent.focus(password);
  expect(document.querySelector('.ax-welcome-duo[data-mood="cover-eyes"]')).toBeInTheDocument();
  fireEvent.change(password, { target: { value: TEST_PASSWORD } });
  expect(document.querySelector('.ax-welcome-duo[data-mood="cover-eyes"]')).toBeInTheDocument();

  fireEvent.focus(screen.getByRole('button', { name: 'Show password' }));
  expect(document.querySelector('.ax-welcome-duo[data-mood="cover-eyes"]')).toBeInTheDocument();
  fireEvent.blur(screen.getByRole('button', { name: 'Show password' }), { relatedTarget: null });
  expect(document.querySelector('.ax-welcome-duo[data-mood="happy"]')).toBeInTheDocument();
});


test('wrong credentials show branded feedback without discarding the entered email or password', async () => {
  signIn.mockResolvedValueOnce({ data: { user: null, session: null }, error: { code: 'invalid_credentials', message: 'Invalid login credentials' } });
  const setIsAuthed = jest.fn();
  render(<Harness initialPage="login" setIsAuthed={setIsAuthed} />);
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'HELLO@example.test' } });
  fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: TEST_PASSWORD } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in securely' }));
  const title = await screen.findByText('That duo didn’t click.');
  const feedback = title.closest('[role="alert"]');
  expect(feedback).toHaveClass('ax-login-feedback');
  expect(feedback.querySelector('.ax-feedback-character')).toHaveAttribute('aria-hidden', 'true');
  const pair = feedback.querySelector('.ax-error-buddy.ax-login-duo[data-mood="teary"]');
  expect(pair).toHaveAttribute('aria-hidden', 'true');
  expect(pair.querySelectorAll('.ax-duo-character')).toHaveLength(2);
  expect(pair.querySelector('[data-character="boy"]')).toBeInTheDocument();
  expect(pair.querySelector('[data-character="girl"]')).toBeInTheDocument();
  expect(pair.querySelector('svg, img')).not.toBeInTheDocument();
  expect(document.querySelector('.ax-welcome-duo')).not.toBeInTheDocument();
  expect(feedback.querySelector('.ax-feedback-logo, img')).not.toBeInTheDocument();
  expect(document.querySelector('.ax-login-tears')).toHaveAttribute('aria-hidden', 'true');
  expect(document.querySelector('.ax-login-tears')).toHaveAttribute('focusable', 'false');
  expect(screen.getByLabelText('Email address')).toHaveValue('HELLO@example.test');
  expect(screen.getByLabelText('Password', { exact: true })).toHaveValue(TEST_PASSWORD);
  expect(setIsAuthed).not.toHaveBeenCalled();
});

test('the wrong-credentials reset action opens recovery with the same email', async () => {
  signIn.mockResolvedValueOnce({ data: { user: null, session: null }, error: { code: 'invalid_credentials', message: 'Invalid login credentials' } });
  render(<Harness initialPage="login" />);
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'hello@example.test' } });
  fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: TEST_PASSWORD } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in securely' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Reset password', exact: true }));
  expect(screen.getByRole('heading', { name: 'Reset your password.' })).toBeInTheDocument();
  expect(screen.getByLabelText('Account email')).toHaveValue('hello@example.test');
  expect(screen.queryByText('That duo didn’t click.')).not.toBeInTheDocument();
  expect(resetPassword).not.toHaveBeenCalled();
});

test('a malformed sign-in email gets local playful feedback without an authentication request', () => {
  render(<Harness initialPage="login" />);
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'forgot-the-at-sign' } });
  fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: TEST_PASSWORD } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in securely' }));
  expect(screen.getByText('That email took a wrong turn.').closest('[role="alert"]')).toHaveClass('ax-login-feedback');
  expect(document.querySelector('.ax-login-tears')).toHaveAttribute('aria-hidden', 'true');
  expect(screen.getByLabelText('Email address')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByLabelText('Email address')).toHaveValue('forgot-the-at-sign');
  expect(signIn).not.toHaveBeenCalled();
});

test('network errors use a neutral connection message, not playful wrong-credentials feedback', async () => {
  signIn.mockRejectedValueOnce(new Error('Failed to fetch'));
  render(<Harness initialPage="login" />);
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'hello@example.test' } });
  fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: TEST_PASSWORD } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in securely' }));
  const message = await screen.findByText('We could not reach Tawaslo. Check your connection and try again.');
  expect(message.closest('[role="alert"]')).not.toHaveClass('ax-login-feedback');
  expect(document.querySelector('.ax-login-tears')).not.toBeInTheDocument();
  expect(document.querySelector('.ax-login-duo[data-mood="teary"]')).not.toBeInTheDocument();
  expect(document.querySelector('.ax-welcome-duo[data-mood="happy"]')).toBeInTheDocument();
  expect(screen.queryByText('That duo didn’t click.')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Reset password', exact: true })).not.toBeInTheDocument();
  expect(screen.getByLabelText('Password', { exact: true })).toHaveValue(TEST_PASSWORD);
});

test('a repeated wrong-credentials attempt retries and restarts the feedback without losing values', async () => {
  const consoleError = jest.spyOn(console, 'error');
  signIn.mockResolvedValue({ data: { user: null, session: null }, error: { code: 'invalid_credentials', message: 'Invalid login credentials' } });
  render(<Harness initialPage="login" />);
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'hello@example.test' } });
  fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: TEST_PASSWORD } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in securely' }));
  const firstFeedback = (await screen.findByText('That duo didn’t click.')).closest('[role="alert"]');
  fireEvent.click(screen.getByRole('button', { name: 'Sign in securely' }));
  const nextFeedback = (await screen.findByText('That duo didn’t click.')).closest('[role="alert"]');
  expect(signIn).toHaveBeenCalledTimes(2);
  expect(nextFeedback).not.toBe(firstFeedback);
  expect(nextFeedback).toHaveClass('ax-login-feedback');
  expect(consoleError.mock.calls.some(([message]) => String(message).includes('same key'))).toBe(false);
  expect(screen.getByLabelText('Email address')).toHaveValue('hello@example.test');
  expect(screen.getByLabelText('Password', { exact: true })).toHaveValue(TEST_PASSWORD);
});

test('editing a rejected sign-in entry removes the tears and error character immediately', async () => {
  signIn.mockResolvedValueOnce({ data: { user: null, session: null }, error: { code: 'invalid_credentials', message: 'Invalid login credentials' } });
  render(<Harness initialPage="login" />);
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'hello@example.test' } });
  fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: TEST_PASSWORD } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in securely' }));
  await screen.findByText('That duo didn’t click.');
  expect(document.querySelector('.ax-login-tears')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: 'corrected-test-password' } });
  expect(document.querySelector('.ax-login-tears')).not.toBeInTheDocument();
  expect(document.querySelector('.ax-feedback-character')).not.toBeInTheDocument();
  expect(document.querySelector('.ax-login-duo[data-mood="teary"]')).not.toBeInTheDocument();
  expect(document.querySelector('.ax-welcome-duo[data-mood="happy"]')).toBeInTheDocument();
  expect(screen.queryByText('That duo didn’t click.')).not.toBeInTheDocument();
});

test('three decorative tears route from both sprite eye anchors to the first letter of Welcome', () => {
  jest.useFakeTimers();
  const originalRect = Element.prototype.getBoundingClientRect;
  const rectSpy = jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
    if (this.classList.contains('ax-panel-login')) return { left: 100, top: 100, width: 600, height: 500 };
    if (this.classList.contains('ax-duo-character')) return { left: this.dataset.character === 'boy' ? 110 : 190, top: 110, width: 80, height: 100 };
    return originalRect.call(this);
  });
  const mockRange = {
    setStart: jest.fn(), setEnd: jest.fn(),
    getBoundingClientRect: () => ({ left: 112, top: 240, width: 32, height: 45 }),
  };
  const rangeSpy = jest.spyOn(document, 'createRange').mockReturnValue(mockRange);
  try {
    render(<Harness initialPage="login" />);
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'missing-at-sign' } });
    fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: TEST_PASSWORD } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in securely' }));
    act(() => { jest.advanceTimersByTime(240); });
    const welcome = screen.getByRole('heading', { name: 'Welcome back.' });
    expect(mockRange.setStart).toHaveBeenCalledWith(welcome.firstChild, 0);
    expect(mockRange.setEnd).toHaveBeenCalledWith(welcome.firstChild, 1);
    const overlay = document.querySelector('.ax-login-tears');
    expect(overlay).toHaveAttribute('viewBox', '0 0 600 500');
    const trajectories = overlay.querySelectorAll('animateMotion');
    expect(trajectories).toHaveLength(3);
    const characters = Array.from(document.querySelectorAll('.ax-error-buddy .ax-duo-character'));
    trajectories.forEach((trajectory, index) => {
      const points = trajectory.getAttribute('path').match(/-?\d+(?:\.\d+)?/g).map(Number);
      const character = characters[index === 1 ? 1 : 0];
      const eyeX = Number(character.dataset.tearX);
      const eyeY = Number(character.dataset.tearY);
      expect(eyeX).toBeGreaterThan(0);
      expect(eyeX).toBeLessThan(1);
      expect(eyeY).toBeGreaterThan(0);
      expect(eyeY).toBeLessThan(1);
      expect(points[0]).toBeCloseTo((index === 1 ? 90 : 10) + 80 * eyeX);
      expect(points[1]).toBeCloseTo(10 + 100 * eyeY);
      expect(points[points.length - 2]).toBeCloseTo(24.8 + (index - 1) * 4);
      expect(points[points.length - 1]).toBeCloseTo(164.75);
      expect(trajectory).toHaveAttribute('dur', '.95s');
    });
  } finally {
    rangeSpy.mockRestore();
    rectSpy.mockRestore();
  }
});

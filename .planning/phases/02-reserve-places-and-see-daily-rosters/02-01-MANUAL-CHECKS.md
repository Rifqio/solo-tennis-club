# Customer access manual checks

Source and non-browser verification are separate from manual UI acceptance. Browser automation remains disabled. Run the development server and open **Akun / Account** or `/customer/sign-in`.

- [ ] Enter an Indonesian `08…` number or an international `+…` number. Request code. Confirm the development notice says no WhatsApp/SMS was sent; the code also appears as `debugCode` in the API response.
- [ ] Verify only after typing/pasting all six digits, including a leading zero. Check wrong-code guidance, five-minute expiry and the resend countdown. A replacement code supersedes the old one.
- [ ] For a new number, complete your name. An existing number skips name entry and retains its existing name. Phone/name validation keeps your input and focuses the affected field.
- [ ] Reload during code entry and again during name completion. Both steps recover through cookies. No OTP or credentials appear in localStorage/sessionStorage.
- [ ] Open session details, choose **Masuk dengan nomor telepon**, finish access, and verify that the selected date and session details reopen. Signing in alone creates no reservation.
- [ ] Open Account while signed in; name/phone appear. Sign out, then reload: private identity is gone. If sign-out fails, the account remains visibly signed in with retry guidance.
- [ ] Complete the flow in Indonesian and English. Changing language preserves your current input.
- [ ] Check phone width, an intermediate/tablet width and desktop; both device themes, reduced motion, keyboard Tab/Enter, focus after steps, long names and enlarged text. Actions remain reachable above the keyboard and bottom navigation, without horizontal overflow.
- [ ] Customer access cannot open the admin portal. Admin credentials/session cannot authorize customer endpoints.

Development test data verifies application behavior only. AUTH-02 real WhatsApp/SMS delivery remains a release prerequisite. No manual acceptance is recorded until the user supplies it.

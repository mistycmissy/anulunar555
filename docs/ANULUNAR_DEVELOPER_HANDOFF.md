
# AnuLunar™ Developer Handoff Spec
## Access & Payments Logic

### Core Principle
Free access is always true. Paid access only adds layers.

### Access State Model
```js
access_state = {
  free_access: true,
  subscription_tier: null,
  owned_reports: [],
  patron_access: false,
  investment_access: false,
  practitioner_access: false
}
```

### Rules
- free_access is never false
- Stripe only adds access
- Removing paid access never removes free access

### Unlock Logic
```js
function isUnlocked(reportKey, access_state) {
  return (
    access_state.free_access === true ||
    access_state.owned_reports.includes(reportKey) ||
    access_state.subscription_tier !== null
  );
}
```

### Stripe Integration Rules
- No Stripe product for free tier
- No $0 prices
- No trials for free access
- Webhooks only add access

### UI Enforcement
- Free content always renders
- Paid content degrades gracefully
- No lock overlays on free content

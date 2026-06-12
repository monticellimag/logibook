import { logAudit } from '../src/lib/audit';

// This script invokes logAudit directly to prove the mapping works
logAudit({
  userId: 'test-vettore',
  userEmail: 'vettore@test.it',
  userRole: 'user', // Passing the raw database value
  action: 'LOGIN',
  entity: 'auth',
  details: 'Test login per verificare il mapping del ruolo'
});

setTimeout(() => {
  console.log("Log generated.");
  process.exit(0);
}, 500);

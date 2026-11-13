# Helix Health: Patient Portal kickoff

## Goals
Launch a self-service portal where Helix patients book appointments, sign consent forms and see their history. Go-live is planned for 15 January 2027.

## Contacts
Meera Iyer is the Helix IT lead and owns their Azure AD tenant. Daniel Costa is the product owner and signs off each release.

## Decisions
Staff sign in through Azure AD only, with no local passwords. Every role change must be audit logged, and audit logs are kept for 7 years for compliance.

## Risks
Any Azure AD change needs approval from the Helix IT change board, which meets on Thursdays. Missing a Thursday adds a week.

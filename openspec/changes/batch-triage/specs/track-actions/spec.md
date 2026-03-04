## MODIFIED Requirements

### Requirement: Independent action state
The "Add" and "Remove" actions for a given track SHALL be coupled through the batch execution model. For each track in the batch, the ADD operation SHALL execute before the REMOVE operation. If the ADD fails, the REMOVE for that track SHALL be skipped. Actions are no longer triggered independently by individual button clicks — they are staged via triage state and committed together in a batch.

#### Scenario: Batch replaces independent actions
- **WHEN** user confirms batch apply with 3 tracks staged
- **THEN** each track's add and remove operations execute sequentially as a pair, not as independent user-triggered actions

#### Scenario: Add failure skips remove
- **WHEN** the add operation for a track fails during batch apply
- **THEN** the remove operation for that track is skipped to preserve the original

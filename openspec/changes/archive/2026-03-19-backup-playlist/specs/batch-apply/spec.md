## MODIFIED Requirements

### Requirement: Sequential batch execution
The system SHALL execute staged operations in two phases. The batch executor SHALL accept a user ID parameter and a backup flag (boolean, default true). **Phase 1 (Backup):** When backup is enabled and the batch contains REMOVE operations, the system SHALL collect all unique track URIs from REMOVE operations, find or create the "Spotless Backup" playlist, and add those tracks to it. When backup is disabled, this phase is skipped. **Phase 2 (Execute):** The system SHALL execute staged operations sequentially, one API call at a time. For each track, the ADD operation SHALL execute before the REMOVE operation. The system SHALL report progress as each operation completes (completed count / total count).

#### Scenario: Execute order with backup
- **WHEN** batch apply starts with 3 tracks (each with ADD + REMOVE)
- **THEN** all 3 original tracks are backed up first, then operations execute: track1-ADD, track1-REMOVE, track2-ADD, track2-REMOVE, track3-ADD, track3-REMOVE

#### Scenario: Progress reporting
- **WHEN** 2 of 6 operations have completed
- **THEN** progress reports 2/6

#### Scenario: Backup phase with mixed ops
- **WHEN** batch contains 2 replacements (ADD+REMOVE each) and 1 standalone removal
- **THEN** all 3 original track URIs are backed up before any operations execute

#### Scenario: Batch with no removals
- **WHEN** batch contains only ADD operations (no REMOVE ops)
- **THEN** the backup phase is skipped and operations execute normally

#### Scenario: Backup failure aborts batch
- **WHEN** the backup phase fails (playlist creation or track addition error)
- **THEN** no operations are executed, and all ops are returned as failed with error "Backup failed: {error message}"

#### Scenario: Deduplicated backup URIs
- **WHEN** a track appears in multiple remove operations (same URI)
- **THEN** the track is backed up only once (unique URIs)

#### Scenario: Backup disabled by user
- **WHEN** the backup flag is false and the batch contains REMOVE operations
- **THEN** the backup phase is skipped and operations execute without backing up tracks

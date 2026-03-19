## MODIFIED Requirements

### Requirement: Confirmation modal
Clicking "Apply Changes" SHALL open a modal titled "Review Changes" listing pending operations grouped as: **REPLACE items** (each showing a green REPLACE badge, the candidate name, and destination source) followed by **REMOVE items** (each showing a red REMOVE badge, the original track name, and source). The subtitle SHALL show the same summary as the apply bar. When the batch includes any REMOVE operations (standalone removals or removals from replacements), the modal SHALL display a backup checkbox between the subtitle and the operations list. The checkbox SHALL be **checked by default** with label: "Back up removed tracks to Spotless Backup playlist". The checkbox state SHALL be passed to the batch executor to control whether backup occurs. Footer SHALL contain "Cancel" and "Apply N changes" buttons.

#### Scenario: Review modal with backup checkbox
- **WHEN** user clicks "Apply Changes" with 3 replacements and 2 removals
- **THEN** modal shows 3 items with green REPLACE badge followed by 2 items with red REMOVE badge, subtitle "Replacing 3, removing 2", a checked backup checkbox labeled "Back up removed tracks to Spotless Backup playlist", and "Apply 8 changes" button (counting individual ops)

#### Scenario: User unchecks backup
- **WHEN** user unchecks the backup checkbox and clicks "Apply N changes"
- **THEN** the batch executes without backing up tracks to the backup playlist

#### Scenario: Backup checkbox default state
- **WHEN** the review modal opens with any remove operations
- **THEN** the backup checkbox is checked by default

#### Scenario: No remove operations hides checkbox
- **WHEN** the batch contains only ADD operations with no remove operations
- **THEN** the backup checkbox is not displayed

#### Scenario: Review modal with only replacements
- **WHEN** user clicks "Apply Changes" with 2 replacements and 0 standalone removals
- **THEN** modal shows the backup checkbox because replacements include implicit remove operations

#### Scenario: Cancel review
- **WHEN** user clicks "Cancel"
- **THEN** the modal closes with no changes

# SanctuaryAI design system

**Identity:** SanctuaryAI is a calm, trustworthy ministry workspace. Its product promise is **“Thoughtful tools for faithful ministry.”** Interfaces should feel reverent without becoming ornamental, and operational without feeling clinical.

## Foundations

Global tokens live in `src/styles.css`. Violet communicates primary action and AI assistance; green indicates healthy/successful states; amber indicates attention; red is reserved for destructive actions and failures; blue is informational. The spacing scale is based on 4px, radii range from 8–16px, and elevation is deliberately subtle. Every interactive control uses the shared visible focus ring.

## Primitives

- `.btn`, `.btn.secondary`, and `.btn.danger` cover primary, neutral, and destructive actions. Buttons must have an accessible name and use a real `button` or link element.
- `.card`, `.badge` (plus `warning`, `danger`, and `info` modifiers), `.field`, `.grid`, and `.sr-only` are shared CSS primitives.
- `StatePanelComponent` provides empty, offline, permission-denied, and error feedback with an optional recovery action.
- `ProgressComponent` announces determinate job or upload progress; `SkeletonComponent` announces loading without presenting false data.
- `ConfirmDialogComponent` provides an `alertdialog` for explicit destructive confirmation. The caller owns open state and performs the confirmed operation.
- `ToastRegionComponent` is mounted once at the application root. Create notifications through `PlatformStateService.notify`; messages are announced through a polite live region and can be dismissed.

## Responsive and accessible use

Compose cards in CSS Grid and collapse multi-column layouts at their feature-specific content breakpoint (typically 1000px, then 520px). On small screens, preserve document flow rather than forcing horizontal scrolling. Tables that cannot fit must provide a card-list presentation with the same labels and actions. Honor reduced motion globally, never encode status by color alone, maintain a logical heading order, and move or restore focus when opening and closing modal UI.

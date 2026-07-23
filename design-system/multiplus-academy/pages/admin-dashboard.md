# Admin dashboard override — Ledger Light

## Subject, audience, job

**Subject:** the MultiPlus Academy academic operations ledger.  
**Audience:** administrators coordinating people, courses, certificates and academic exceptions.  
**Single job:** answer “what needs institutional attention next?” without requiring the administrator to decode decorative analytics.

## Deliberate design plan

### Tokens

```text
Ink spine       #0B1629
Ink panel       #101827
Mineral canvas  #FAFAF9
Paper panel     #FFFFFF
Antique gold    #A16207
Slate line      #D6D3D1
Alert red       #DC2626
Success green   #15803D
```

### Typography

- **Operational body:** Fira Sans, 16px base, line-height 1.5.
- **Data labels:** Fira Code, only for terse metadata, dates, codes and state.
- **Institutional display:** existing Playfair Display, restrained to page title and one heading per section. It preserves the Academy’s editorial character without turning every card into a brochure.

### Layout

```text
[ ink navigation spine ] [ top context bar                         ]
[ ink navigation spine ] [ page thesis + primary action            ]
[ ink navigation spine ] [ 4 operational metrics                   ]
[ ink navigation spine ] [ action queue          | calendar/status ]
[ ink navigation spine ] [ course / people ledger                  ]
```

The signature element is the **academic ledger line**: a small antique-gold vertical rule preceding section names and important operational status. It is not decoration; it marks items that require administrative ownership.

### Critique before implementation

A generic SaaS approach would add colorful KPI gradients, glass cards and ornamental charts. That would obscure the academic workflow and repeat a common dashboard default. Ledger Light instead uses the dark navigation spine, mineral working surface, restrained gold rule and dense-but-breathable ledger rows. The result is specific to academic coordination: it feels like an authoritative register, not a marketing analytics page.

### Motion

Only `opacity + translateY(8px)` entrance at 180–240ms is allowed. Respect `prefers-reduced-motion`; no repeating pulses except an unread/live status that is paired with text. Buttons use a 150ms color/elevation state without layout shift.

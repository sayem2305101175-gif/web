# Future Deploy Notes

## Pending: Tier 3.2b SEO assets

This was intentionally not implemented yet.

Reason:
- `sitemap.xml` should use the real production domain with absolute URLs.
- The project does not have a confirmed live domain yet.

When a production domain is available:
1. Add `public/robots.txt`
2. Add `public/sitemap.xml`
3. Use absolute URLs, for example:
   - `https://your-domain.com/`
   - `https://your-domain.com/collection`
   - `https://your-domain.com/wishlist`

Current status:
- Tier 3.1 completed
- Tier 3.2a completed
- Tier 3.2b deferred until domain is known

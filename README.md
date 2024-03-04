# remark-auto-ads

remark.js plugin that automatically inserts Google Adsense (and theoretically any ad service) code.

This plugin inserts an ad code for each specified number of paragraphs. For example, insert Google Adsense display ad code every 5 paragraphs.

(Unlike Google Adsense's automatic ads) no ad code is inserted into blockquote or list items!

## Install

```bash
npm install remark-auto-ads
```

## Usage

```javascript
import remark from "remark";
import remarkAutoAds from "remark-auto-ads";

const processor = remark().use(remarkAutoAds, {
    adCode: "<AD_CODE>",
    paragraphInterval: 2
});

const markdown = `
# Hello, world!

This is a paragraph.

This is a paragraph.

This is a paragraph.

This is a paragraph.
`;

processor.process(markdown).then((result) => {
    console.log(result.toString());
});
```

The above code will output the following:

```markdown
# Hello, world!

This is a paragraph.

This is a paragraph.

<AD_CODE>

This is a paragraph.

This is a paragraph.

<AD_CODE>
```

## Options

```typescript
export interface RemarkAutoAdsOptions {
    adCode: string;
    countFrom?: number;
    paragraphInterval?: number;
}
```

### ``adCode``

The ad code to be inserted. For example, Google Adsense display ad code.

### ``countFrom``

Initial value of paragraph counter. In other words, this value should be set to the value of ``paragraphInterval`` minus the number of paragraphs you want to insert the first ad.

If you want to insert ad code from the third paragraph and every 5 paragraphs, set this to ``2``.

Default: ``0``

### ``paragraphInterval``

The value indicating how many paragraphs to insert advertising code. For example, specifying 5 will insert ads every 5 paragraphs.

Default: ``5``

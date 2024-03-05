# rehype-auto-ads

rehype.js plugin that automatically inserts Google Adsense (and theoretically any ad service) code.

This plugin inserts an ad code for each specified number of paragraphs. For example, insert Google Adsense display ad code every 5 paragraphs.

(Unlike Google Adsense's automatic ads) no ad code is inserted into blockquote or list items!

## Install

```bash
npm install rehype-auto-ads
```

## Usage

```javascript
import remarkParse from "remark-parse";
import rehypeStringify from "rehype-stringify";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import rehypeAutoAds from "rehype-auto-ads";

const options = {
    adCode: "<AD_CODE>",
    paragraphInterval: 2
};

const processor = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeAutoAds, options)
    .use(rehypeStringify);

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
<h1>Hello, world!</h1>
<p>This is a paragraph.</p>
<p>This is a paragraph.</p><AD_CODE>
<p>This is a paragraph.</p>
<p>This is a paragraph.</p><AD_CODE>
```

## Options

```typescript
export interface RehypeAutoAdsOptions {
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

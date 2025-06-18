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
    paragraphInterval: 2,
    maxAds: 3
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
    shouldInsertAd?: (
        vfile: VFile,
        previousNode: Root | ElementContent | Doctype,
        nextNode: Root | ElementContent | Doctype | null,
        ancestors: (Root | Element)[]
    ) => boolean;
    maxAds?: number;
}
```

### ``adCode``

The ad code to be inserted. For example, Google Adsense display ad code.

When a string is provided, it will be used as-is for all ad insertions.

When a function is provided, it will be executed each time an ad is inserted with a parameter indicating which ad is being inserted (1 for first ad, 2 for second ad, etc.), allowing generation of different ad code based on position.

### ``countFrom``

Initial value of paragraph counter. In other words, this value should be set to the value of ``paragraphInterval`` minus the number of paragraphs you want to insert the first ad.

If you want to insert ad code from the third paragraph and every 5 paragraphs, set this to ``2``.

Default: ``0``

### ``paragraphInterval``

The value indicating how many paragraphs to insert advertising code. For example, specifying 5 will insert ads every 5 paragraphs.

Default: ``5``

### ``shouldInsertAd``

Function to determine whether to insert an ad code. If this function returns ``true``, the ad code will be inserted. The default implementation always returns ``true``.

#### Parameters

- ``vfile``: vfile of the current file.
- ``previousNode``: The previous node of the insertion point.
- ``nextNode``: The next node of the insertion point.
- ``ancestors``: Ancestors of the `previousNode`.

### ``maxAds``

The maximum number of ads to be inserted.

Default: ``Infinity``

## Development

```bash
npm install
```

### Build

```bash
npm run build
```

### Format and Lint

```bash
npm run format
npm run lint
```

### Test

```bash
npm run test
```

### Pull Requests

This repository uses [Changesets](https://github.com/changesets/changesets) to manage versioning and releases. When creating a pull request, please run the Changesets CLI and commit the changeset file.

```bash
npx changeset
```

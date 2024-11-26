import { expect, it } from "vitest";
import remarkParse from "remark-parse";
import rehypeStringify from "rehype-stringify";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { isElement } from "hast-util-is-element";
import rehypeAutoAds, { RehypeAutoAdsOptions } from "./index.js";

const AD_CODE = `
<ins class="adsbygoogle"
    style="display:block"
    data-ad-client="ca-pub-xxxxxxxxxxxxxxxx"
    data-ad-slot="xxxxxxxxxx"
    data-ad-format="auto"
    data-full-width-responsive="false"></ins>
<script>
    (adsbygoogle = window.adsbygoogle || []).push({});
</script>`.trim();

const INJECTED_AD_CODE = `
<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-xxxxxxxxxxxxxxxx" data-ad-slot="xxxxxxxxxx" data-ad-format="auto" data-full-width-responsive="false"></ins>
<script>
    (adsbygoogle = window.adsbygoogle || []).push({});
</script>`.trim();

const processorFactory = (options: RehypeAutoAdsOptions) => {
    return unified().use(remarkParse).use(remarkRehype).use(rehypeAutoAds, options).use(rehypeStringify);
};

it("Basic usage", async () => {
    const input = `
# Hello, world!

This is a paragraph.

This is a paragraph.

This is a paragraph.

This is a paragraph.`.trim();

    const processor = processorFactory({
        adCode: AD_CODE,
        paragraphInterval: 2
    });

    const expected = `
<h1>Hello, world!</h1>
<p>This is a paragraph.</p>
<p>This is a paragraph.</p>${INJECTED_AD_CODE}
<p>This is a paragraph.</p>
<p>This is a paragraph.</p>${INJECTED_AD_CODE}`.trim();

    const result = await processor.process(input);
    expect(result.toString().trim()).toBe(expected);
});

it("Basic usage (insert scripts from the first paragraph)", async () => {
    const input = `
# Hello, world!

This is a paragraph.

This is a paragraph.

This is a paragraph.

This is a paragraph.`.trim();

    const processor = processorFactory({
        adCode: AD_CODE,
        paragraphInterval: 3,
        countFrom: 2
    });

    const expected = `
<h1>Hello, world!</h1>
<p>This is a paragraph.</p>${INJECTED_AD_CODE}
<p>This is a paragraph.</p>
<p>This is a paragraph.</p>
<p>This is a paragraph.</p>${INJECTED_AD_CODE}`.trim();

    const result = await processor.process(input);
    expect(result.toString().trim()).toBe(expected);
});

it("Do not insert to blockquote elements", async () => {
    const input = `
# Hello, world!

This is a paragraph.

> This is a paragraph.
>
> This is a paragraph.
>
> This is a paragraph.`.trim();

    const processor = processorFactory({
        adCode: AD_CODE,
        paragraphInterval: 3,
        countFrom: 2
    });

    const expected = `
<h1>Hello, world!</h1>
<p>This is a paragraph.</p>${INJECTED_AD_CODE}
<blockquote>
<p>This is a paragraph.</p>
<p>This is a paragraph.</p>
<p>This is a paragraph.</p>
</blockquote>`.trim();

    const result = await processor.process(input);
    expect(result.toString().trim()).toBe(expected);
});

it("Do not insert to list items", async () => {
    const input = `
# Hello, world!

This is a paragraph.

* This is a paragraph.
* This is a paragraph.
* This is a paragraph.`.trim();

    const processor = processorFactory({
        adCode: AD_CODE,
        paragraphInterval: 3,
        countFrom: 2
    });

    const expected = `
<h1>Hello, world!</h1>
<p>This is a paragraph.</p><ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-xxxxxxxxxxxxxxxx" data-ad-slot="xxxxxxxxxx" data-ad-format="auto" data-full-width-responsive="false"></ins>
<script>
    (adsbygoogle = window.adsbygoogle || []).push({});
</script>
<ul>
<li>This is a paragraph.</li>
<li>This is a paragraph.</li>
<li>This is a paragraph.</li>
</ul>`.trim();

    const result = await processor.process(input);
    expect(result.toString().trim()).toBe(expected);
});

it("Control with shouldInsertAd() function", async () => {
    const input = `
# Hello, world!

This is a paragraph.

This is a paragraph.

- foo
- bar

This is a paragraph.

This is a paragraph.`.trim();

    const processor = processorFactory({
        adCode: AD_CODE,
        paragraphInterval: 1,
        countFrom: 0,
        shouldInsertAd: (_, previousNode, nextNode, ancestors) => {
            if (nextNode && nextNode.type === "text") {
                const parent = ancestors[ancestors.length - 1];
                const index = parent.children.indexOf(nextNode);
                const nextNextNode = parent.children[index + 1];
                return (
                    !(isElement(previousNode) && previousNode.tagName === "ul") &&
                    !(nextNextNode && isElement(nextNextNode) && nextNextNode.tagName === "ul")
                );
            } else {
                return (
                    !(isElement(previousNode) && previousNode.tagName === "ul") &&
                    !(isElement(nextNode) && nextNode.tagName === "ul")
                );
            }
        }
    });

    const expected = `
<h1>Hello, world!</h1>
<p>This is a paragraph.</p>${INJECTED_AD_CODE}
<p>This is a paragraph.</p>
<ul>
<li>foo</li>
<li>bar</li>
</ul>
<p>This is a paragraph.</p>${INJECTED_AD_CODE}
<p>This is a paragraph.</p>${INJECTED_AD_CODE}`.trim();

    const result = await processor.process(input);
    expect(result.toString().trim()).toBe(expected);
});

it("Respect maxAds option", async () => {
    const input = `
# Hello, world!

This is a paragraph.

This is a paragraph.

This is a paragraph.

This is a paragraph.

This is a paragraph.

This is a paragraph.`.trim();

    const processor = processorFactory({
        adCode: AD_CODE,
        paragraphInterval: 1,
        maxAds: 2
    });

    const expected = `
<h1>Hello, world!</h1>
<p>This is a paragraph.</p>${INJECTED_AD_CODE}
<p>This is a paragraph.</p>${INJECTED_AD_CODE}
<p>This is a paragraph.</p>
<p>This is a paragraph.</p>
<p>This is a paragraph.</p>
<p>This is a paragraph.</p>`.trim();

    const result = await processor.process(input);
    expect(result.toString().trim()).toBe(expected);
});

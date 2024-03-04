import { expect, it } from "vitest";
import { remark } from "remark";
import remarkAutoAds from "./index.js";

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

it("basic usage", async () => {
    const input = `
# Hello, world!

This is a paragraph.

This is a paragraph.

This is a paragraph.

This is a paragraph.`.trim();

    const processor = remark().use(remarkAutoAds, {
        adCode: AD_CODE,
        paragraphInterval: 2
    });

    const expected = `
# Hello, world!

This is a paragraph.

This is a paragraph.

${AD_CODE}

This is a paragraph.

This is a paragraph.

${AD_CODE}`.trim();

    const result = await processor.process(input);
    expect(result.toString().trim()).toBe(expected);
});

it("basic usage (insert scripts from the first paragraph)", async () => {
    const input = `
# Hello, world!

This is a paragraph.

This is a paragraph.

This is a paragraph.

This is a paragraph.`.trim();

    const processor = remark().use(remarkAutoAds, {
        adCode: AD_CODE,
        paragraphInterval: 3,
        countFrom: 2
    });

    const expected = `
# Hello, world!

This is a paragraph.

${AD_CODE}

This is a paragraph.

This is a paragraph.

This is a paragraph.

${AD_CODE}`.trim();

    const result = await processor.process(input);
    expect(result.toString().trim()).toBe(expected);
});

it("do not insert to blockquote elements", async () => {
    const input = `
# Hello, world!

This is a paragraph.

> This is a paragraph.
>
> This is a paragraph.
>
> This is a paragraph.`.trim();

    const processor = remark().use(remarkAutoAds, {
        adCode: AD_CODE,
        paragraphInterval: 3,
        countFrom: 2
    });

    const expected = `
# Hello, world!

This is a paragraph.

${AD_CODE}

> This is a paragraph.
>
> This is a paragraph.
>
> This is a paragraph.`.trim();

    const result = await processor.process(input);
    expect(result.toString().trim()).toBe(expected);
});

it("do not insert to list items", async () => {
    const input = `
# Hello, world!

This is a paragraph.

* This is a paragraph.
* This is a paragraph.
* This is a paragraph.`.trim();

    const processor = remark().use(remarkAutoAds, {
        adCode: AD_CODE,
        paragraphInterval: 3,
        countFrom: 2
    });

    const expected = `
# Hello, world!

This is a paragraph.

${AD_CODE}

* This is a paragraph.
* This is a paragraph.
* This is a paragraph.`.trim();

    const result = await processor.process(input);
    expect(result.toString().trim()).toBe(expected);
});

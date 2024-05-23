import type { Doctype, Element, ElementContent, Root } from "hast";
import type { Plugin, Transformer } from "unified";
import type { VFile } from "vfile";
import { fromHtml } from "hast-util-from-html";
import { isElement } from "hast-util-is-element";
import { visitParents } from "unist-util-visit-parents";

/**
 * Options for the rehype-auto-ads plugin.
 */
export interface RehypeAutoAdsOptions {
    /**
     * The ad code to be inserted. For example, Google Adsense display ad code.
     */
    adCode: string;
    /**
     * Initial value of paragraph counter.
     * In other words, this value should be set to the value of ``paragraphInterval``
     * minus the number of paragraphs you want to insert the first ad.
     *
     * If you want to insert ad code from the third paragraph and every 5 paragraphs, set this to ``2``.
     * @default 0
     */
    countFrom?: number;
    /**
     * The value indicating how many paragraphs to insert advertising code.
     * For example, specifying 5 will insert ads every 5 paragraphs.
     * @default 5
     */
    paragraphInterval?: number;
    /**
     * Function to determine whether to insert an ad code.
     * If this function returns ``true``, the ad code will be inserted.
     * The default implementation always returns ``true``.
     * @param vfile vfile of the current file.
     * @param previousNode The previous node of the insertion point.
     * @param nextNode The next node of the insertion point.
     * @param ancestors Ancestors of the ``previousNode``.
     * @returns Whether to insert ads or not.
     */
    shouldInsertAd?: (
        vfile: VFile,
        previousNode: Root | ElementContent | Doctype,
        nextNode: Root | ElementContent | Doctype | null,
        ancestors: (Root | Element)[]
    ) => boolean;
}

/**
 * Complete option data merged with default and user-specified options.
 */
type RehypeAutoAdsFullOptions = Required<RehypeAutoAdsOptions>;

const EXCLUDE_TARGETS = {
    tagNames: ["aside", "blockquote", "ul", "ol", "li"]
};

/**
 * Rehype.js plugin that automatically inserts Google Adsense (and theoretically any ad service) code.
 *
 * This plugin inserts an ad code for each specified number of paragraphs.
 * For example, insert Google Adsense display ad code every 5 paragraphs.
 * @param args Options for the rehype-auto-ads plugin.
 * @returns The transformer function that inserts the ad code.
 */
// eslint-disable-next-line max-lines-per-function
const rehypeAutoAds: Plugin<[RehypeAutoAdsOptions], Root> = (args: RehypeAutoAdsOptions) => {
    const defaultOptions = {
        adCode: "",
        countFrom: 0,
        paragraphInterval: 5,
        // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/explicit-function-return-type
        shouldInsertAd: () => true
    } satisfies Required<RehypeAutoAdsOptions>;

    const options: RehypeAutoAdsFullOptions = {
        ...defaultOptions,
        ...args
    };

    const adCodeHast = fromHtml(options.adCode, { fragment: true }).children as ElementContent[];

    /**
     * The transformer function that inserts the ad code.
     * @param tree The root node of the HAST tree.
     * @param vfile The vfile of the current file.
     */
    const transform: Transformer<Root> = (tree, vfile) => {
        // eslint-disable-next-line no-magic-numbers
        let paragraphCount = options.countFrom || 0;

        // eslint-disable-next-line max-statements
        visitParents<Root, string>(tree, "element", (node, ancestors) => {
            if (!isElement(node) || node.tagName !== "p") return;

            paragraphCount++;

            const skipNode = ancestors.some(
                (ancestor) => isElement(ancestor) && EXCLUDE_TARGETS.tagNames.includes(ancestor.tagName)
            );

            if (skipNode) return;

            // eslint-disable-next-line no-magic-numbers
            const parent = ancestors[ancestors.length - 1];
            const index = parent.children.indexOf(node);
            // eslint-disable-next-line no-magic-numbers
            const nextNode = parent.children[index + 1];

            const shouldInsertAd =
                paragraphCount >= options.paragraphInterval &&
                options.shouldInsertAd(vfile, node, nextNode || null, ancestors);

            if (shouldInsertAd) {
                // eslint-disable-next-line no-magic-numbers
                paragraphCount = 0;

                const ad = structuredClone(adCodeHast);

                // eslint-disable-next-line no-magic-numbers
                if (ancestors.length === 0) return;

                // eslint-disable-next-line no-magic-numbers
                if (index >= 0) {
                    // eslint-disable-next-line no-magic-numbers
                    parent.children.splice(index + 1, 0, ...ad);
                }
            }
        });
    };

    return transform;
};

export default rehypeAutoAds;

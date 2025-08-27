import type { Doctype, Element, ElementContent, Root } from "hast";
import type { Plugin, Transformer } from "unified";
import type { VFile } from "vfile";
import { fromHtml } from "hast-util-from-html";
import { isElement } from "hast-util-is-element";
import { visitParents } from "unist-util-visit-parents";

interface ShouldInsertAdArgs {
    /** `vfile` of the current file. */
    vfile: VFile;
    /** The previous node of the insertion point. */
    previousNode: Root | ElementContent | Doctype;
    /** The next node of the insertion point. */
    nextNode: Root | ElementContent | Doctype | null;
    /** Ancestors of the ``previousNode``. */
    ancestors: Array<Root | Element>;
}

/**
 * Options for the rehype-auto-ads plugin.
 */
interface RehypeAutoAdsOptions {
    /**
     * The ad code to be inserted. For example, Google Adsense display ad code.
     *
     * When a string is provided, it will be used as-is for all ad insertions.
     *
     * When a function is provided, it will be executed each time an ad is inserted with a parameter
     * indicating which ad is being inserted (1 for first ad, 2 for second ad, etc.),
     * allowing generation of different ad code based on position.
     */
    adCode: string | ((adIndex: number) => string);
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
     *
     * Receives a single object argument with:
     * - ``vfile``: vfile of the current file.
     * - ``previousNode``: The previous node of the insertion point.
     * - ``nextNode``: The next node of the insertion point.
     * - ``ancestors``: Ancestors of the `previousNode`.
     * @returns Whether to insert ads or not.
     */
    shouldInsertAd?: (args: ShouldInsertAdArgs) => boolean;
    /**
     * The maximum number of ads to be inserted.
     * @default Infinity
     */
    maxAds?: number;
    /**
     * Controls which ancestor elements should prevent ad insertion.
     * @example
     * When specifying an array, the default list is replaced entirely.
     * ```javascript
     * .use(rehypeAutoAds, {
     * adCode: "<AD_CODE>",
     *   excludeWithin: ["pre", "code"]
     * });
     * ```
     * When specifying a function, the current defaults are passed as an argument, allowing you to extend the defaults.
     * ```javascript
     * .use(rehypeAutoAds, {
     *   adCode: "<AD_CODE>",
     *   excludeWithin: (defaults) => [...defaults, "custom-element"]
     * });
     * ```
     * @default ["aside", "blockquote", "ul", "ol", "li", "table", "pre", "code", "figure"]
     */
    excludeWithin?: string[] | ((defaults: string[]) => string[]);
}

/**
 * Complete option data merged with default and user-specified options.
 */
type RehypeAutoAdsFullOptions = Required<RehypeAutoAdsOptions>;

const DEFAULT_EXCLUDE_TAG_NAMES = ["aside", "blockquote", "ul", "ol", "li", "table", "pre", "code", "figure"];

const FIRST_AD_INDEX = 1;

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
        excludeWithin: DEFAULT_EXCLUDE_TAG_NAMES,
        maxAds: Infinity,
        paragraphInterval: 5,
        // eslint-disable-next-line jsdoc/require-jsdoc
        shouldInsertAd: (): true => true
    } satisfies Required<RehypeAutoAdsOptions>;

    const options: RehypeAutoAdsFullOptions = {
        ...defaultOptions,
        ...args
    };

    /**
     * Compute final excludeWithin tag list per new spec.
     * - When an array is provided: replace defaults entirely.
     * - When a function is provided: receive defaults and return the final list.
     * - When omitted/invalid: use defaults.
     * @returns Final unique tag name list used to block insertion within ancestors.
     */
    const computeExcludeWithin = (): string[] => {
        const defaults = DEFAULT_EXCLUDE_TAG_NAMES;
        const user = options.excludeWithin;

        if (Array.isArray(user)) {
            return Array.from(new Set(user));
        }

        if (typeof user === "function") {
            const result = user(defaults);
            return Array.isArray(result) ? Array.from(new Set(result)) : defaults;
        }

        return defaults;
    };

    const excludedTagNames = computeExcludeWithin();

    /**
     * Converts ad code string to HAST nodes
     * @param code The ad code string to convert
     * @returns Array of ElementContent nodes
     */
    const getAdCodeHast = (code: string): ElementContent[] =>
        fromHtml(code, { fragment: true }).children as ElementContent[];

    const adCodeSource = typeof options.adCode === "string" ? getAdCodeHast(options.adCode) : options.adCode;

    /**
     * The transformer function that inserts the ad code.
     * @param tree The root node of the HAST tree.
     * @param vfile The vfile of the current file.
     */
    // eslint-disable-next-line max-lines-per-function
    const transform: Transformer<Root> = (tree, vfile) => {
        // eslint-disable-next-line no-magic-numbers
        let paragraphCount = options.countFrom || 0;
        let adCount = 0;

        // eslint-disable-next-line max-statements
        visitParents<Root, string>(tree, "element", (node, ancestors) => {
            if (adCount >= options.maxAds) return;
            if (!isElement(node) || node.tagName !== "p") return;

            paragraphCount++;

            const skipNode = ancestors.some(
                (ancestor) => isElement(ancestor) && excludedTagNames.includes(ancestor.tagName)
            );
            if (skipNode) return;

            // eslint-disable-next-line no-magic-numbers
            const parent = ancestors[ancestors.length - 1];
            if (!parent) {
                throw new Error("[rehype-auto-ads] The parent node is not found.");
            }

            const index = parent.children.indexOf(node);
            // eslint-disable-next-line no-magic-numbers
            const nextNode = parent.children[index + 1] ?? null;

            const shouldInsertAd =
                paragraphCount >= options.paragraphInterval &&
                options.shouldInsertAd({ ancestors, nextNode, previousNode: node, vfile });

            if (shouldInsertAd) {
                // eslint-disable-next-line no-magic-numbers
                paragraphCount = 0;

                const ad =
                    typeof adCodeSource === "function"
                        ? getAdCodeHast(adCodeSource(adCount + FIRST_AD_INDEX))
                        : structuredClone(adCodeSource);

                adCount++;

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
export type { RehypeAutoAdsOptions };

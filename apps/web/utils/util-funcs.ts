

    export const splitTextGradient = (splitTextWords: SplitText) => {

        const totalWords = splitTextWords.words.length;
        splitTextWords.words.forEach((word, i) => {
          const progress = (i / totalWords) * 100;
          (word as HTMLElement).style.cssText = `
            display: inline-block;
            background-image: linear-gradient(to right, #39419a, #406eb5 40%, #f6b03f 75%);
            background-size: ${totalWords * 100}% 100%;
            background-position: ${progress}% 0;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
          `;
        });
      }
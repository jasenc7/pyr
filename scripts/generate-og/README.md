# generate-og

generate-og is the first example of pyr eating it's own dogfood.

This is how it was made:

1. `pyr init genetate-og`
2. `cd generate-og`
3. `pyr add pillow`
4. make edits to `generate-og/app/main.py`
5. `pyr run`
6. an `og.png` is now in my site's static directory.
7. `.gitignore` comes along with `pyr init` allowing you to burry sub-apps in python regardless of
   your repo's main language.

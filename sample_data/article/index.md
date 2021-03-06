# Welcome to your new blog

If you see this page, that means it's working

## Guide to Markdown formatting

* [Headers](#headers)
* [Emphasis](#emphasis)
* [Lists](#lists)
* [Links](#links)
* [Images](#images)
* [Code and Syntax Highlighting](#codeandsyntaxhighlighting)
* [Tables](#tables)
* [Blockquotes](#blockquotes)
* [Inline HTML](#inlinehtml)
* [Horizontal Rule](#horizontalrule)
* [Line Breaks](#linebreaks)
* [Check Boxes](#checkboxes)
* [Spoilers](#spoilers)
* [Math Equations](#mathequations)
* [UML](#uml)
* [Diagrams](#diagrams)
* [Youtube Videos](#youtubevideos)

### Headers
[Back to top](#top)

# H1
## H2
### H3
#### H4
##### H5
###### H6

Alternatively, for H1 and H2, an underline-ish style:

Alt-H1
======

Alt-H2
------

### Emphasis
[Back to top](#top)

Emphasis, aka italics, with *asterisks* or _underscores_.

Strong emphasis, aka bold, with **asterisks** or __underscores__.

Combined emphasis with **asterisks and _underscores_**.

Strikethrough uses two tildes. ~~Scratch this.~~

### Lists
[Back to top](#top)

1. First ordered list item
2. Another item
  * Unordered sub-list. 
1. Actual numbers don't matter, just that it's a number
  1. Ordered sub-list
4. And another item.

   You can have properly indented paragraphs within list items. Notice the blank line above, and the leading spaces (at least one, but we'll use three here to also align the raw Markdown).

   To have a line break without a paragraph, you will need to use two trailing spaces.⋅⋅
   Note that this line is separate, but within the same paragraph.⋅⋅
   (This is contrary to the typical GFM line break behaviour, where trailing spaces are not required.)

* Unordered list can use asterisks
- Or minuses
+ Or pluses

### Links
[Back to top](#top)

[I'm an inline-style link](https://www.google.com)

[I'm an inline-style link with title](https://www.google.com "Google's Homepage")

[I'm a reference-style link][Arbitrary case-insensitive reference text]

[I'm a relative reference to a repository file](../blob/master/LICENSE)

[You can use numbers for reference-style link definitions][1]

Or leave it empty and use the [link text itself].

URLs and URLs in angle brackets will automatically get turned into links. 
http://www.example.com or <http://www.example.com> and sometimes 
example.com (but not on Github, for example).

Some text to show that the reference links can follow later.

[arbitrary case-insensitive reference text]: https://www.mozilla.org
[1]: http://slashdot.org
[link text itself]: http://www.reddit.com

### Images
[Back to top](#top)

Here's our logo (hover to see the title text):

Inline-style: 
![alt text](https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png "Logo Title Text 1")

Reference-style: 
![alt text][logo]

[logo]: https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png "Logo Title Text 2"


### Code and Syntax Highlighting
[Back to top](#top)

Inline `code` has `back-ticks around` it.

```javascript
var s = "JavaScript syntax highlighting";
alert(s);
```
 
```python
s = "Python syntax highlighting"
print s
```
 
```
No language indicated, so no syntax highlighting. 
But let's throw in a <b>tag</b>.
```


### Tables
[Back to top](#top)

Colons can be used to align columns.

| Tables        | Are           | Cool  |
| ------------- |:-------------:| -----:|
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |

There must be at least 3 dashes separating each header cell.
The outer pipes (|) are optional, and you don't need to make the 
raw Markdown line up prettily. You can also use inline Markdown.

Markdown | Less | Pretty
--- | --- | ---
*Still* | `renders` | **nicely**
1 | 2 | 3

### Blockquotes
[Back to top](#top)

> Blockquotes are very handy in email to emulate reply text.
> This line is part of the same quote.

Quote break.

> This is a very long line that will still be quoted properly when it wraps. Oh boy let's keep writing to make sure this is long enough to actually wrap for everyone. Oh, you can *put* **Markdown** into a blockquote.

### Inline HTML
[Back to top](#top)

<dl>
  <dt>Definition list</dt>
  <dd>Is something people use sometimes.</dd>

  <dt>Markdown in HTML</dt>
  <dd>Does *not* work **very** well. Use HTML <em>tags</em>.</dd>
</dl>

### Horizontal Rule
[Back to top](#top)

Three or more...

---

Hyphens

***

Asterisks

___

Underscores

### Line Breaks
[Back to top](#top)

Here's a line for us to start with.

This line is separated from the one above by two newlines, so it will be a *separate paragraph*.

This line is also a separate paragraph, but...
This line is only separated by a single newline, so it's a separate line in the *same paragraph*.

### Check Boxes
[Back to top](#top)

* [x] Task completed
* [] Task to do

### Spoilers
[Back to top](#top)

<details><summary>Title of the spoiler (click)</summary><p>
Content of the spoiler  

On several lines
</p></details>

### Math Equations
[Back to top](#top)

You can use LaTeX equations with MathJax for full equations and inline ones (based on the number of $) :

$$
\large{\beta=\sum_{i}^{\alpha }\frac{x^{i}}{\alpha}}
$$


Where $\alpha$ is cool

### UML
[Back to top](#top)

You can use PlantUML diagrams with `@startuml` and `@enduml` tags :

@startuml
title Article
cloud web
node nodejs {
    TCP -right- [express]
    [showdown]
}
package data {
    package "2019/06/18" {
        component index [
            index.md
            image.png
            ...
        ]
    }
}
web -down-> TCP : 1. /2019/06/18/title
express -down-> index : 2. fetch
index -up-> showdown : 3. markdown
showdown -left-> express : 4. html
express -up-> web : 5. html
@enduml

### Diagrams
[Back to top](#top)

You can use [fa-diagrams](https://github.com/Klemek/fa-diagrams) with `@startfad` and `@endfad` tags and using [TOML](https://github.com/toml-lang/toml) inside

@startfad
[[nodes]]
name = "node1"
icon = "laptop-code"
color = "#4E342E"
bottom = "my app"

[[nodes]]
name = "node2"
icon = "globe"
color = "#455A64"
bottom = "world"

[[links]]
from = "node1"
to = "node2"
color = "#333333"
bottom = '"hello"'

  [links.top]
  icon = "envelope"
@endfad

### Youtube Videos
[Back to top](#top)

Just use the "embedded" export on Youtube with dimensions of 535x300 for best results

<iframe width="535" height="300" src="https://www.youtube.com/embed/FTQbiNvZqaY" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>